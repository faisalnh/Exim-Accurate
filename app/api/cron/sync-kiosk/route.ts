import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    listInventoryAdjustments,
    getInventoryAdjustmentDetail,
} from "@/lib/accurate/inventory";
import {
    refreshSession,
    refreshAccessToken,
} from "@/lib/accurate/client";

const CRON_SECRET = process.env.CRON_SECRET;

// Helper: delay between API calls to avoid rate limiting
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: Request) {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-based
        const startOfMonth = new Date(year, now.getMonth(), 1);
        const startDateStr = startOfMonth.toISOString().split("T")[0];

        // Get all users with credentials
        const users = await prisma.user.findMany({
            include: {
                accurateCredentials: true,
            },
        });

        const results: { userId: string; status: string; error?: string }[] = [];

        for (const user of users) {
            try {
                console.log(`[sync-kiosk] Syncing for user ${user.email}...`);

                interface KioskUser {
                    email: string;
                    name: string;
                    count: number;
                }

                interface KioskItem {
                    itemCode: string;
                    itemName: string;
                    totalQuantity: number;
                }

                const usersByEmail = new Map<string, KioskUser>();
                const itemsByCode = new Map<string, KioskItem>();
                const dailyCounts = new Map<string, number>();
                let totalCheckouts = 0;

                for (let cred of user.accurateCredentials) {
                    if (!cred.apiToken) continue;

                    try {
                        // Ensure session is available
                        if ((!cred.host || !cred.session) && cred.dbId) {
                            const { host, session: newSession } = await refreshSession(
                                cred.apiToken,
                                cred.dbId,
                            );
                            cred = await prisma.accurateCredentials.update({
                                where: { id: cred.id },
                                data: { host, session: newSession },
                            });
                        }

                        if (!cred.host || !cred.session) continue;

                        // Fetch all pages of inventory adjustments
                        let page = 1;
                        let hasMore = true;
                        const allSelfCheckoutIds: { id: number; transDate: string; description: string }[] = [];

                        while (hasMore) {
                            let response;
                            try {
                                response = await listInventoryAdjustments(
                                    {
                                        apiToken: cred.apiToken,
                                        signatureSecret: cred.signatureSecret,
                                        host: cred.host!,
                                        session: cred.session!,
                                    },
                                    page,
                                    100,
                                    { startDate: startDateStr },
                                );
                            } catch (err: any) {
                                // Try refreshing token once
                                if (
                                    (err.message?.includes("401") ||
                                        err.message?.includes("invalid_token")) &&
                                    cred.refreshToken
                                ) {
                                    console.log(`[sync-kiosk] Refreshing token for ${cred.id}...`);
                                    const { accessToken, refreshToken: newRefreshToken } =
                                        await refreshAccessToken(
                                            cred.refreshToken,
                                            process.env.ACCURATE_CLIENT_ID!,
                                            process.env.ACCURATE_CLIENT_SECRET!,
                                        );

                                    cred = await prisma.accurateCredentials.update({
                                        where: { id: cred.id },
                                        data: {
                                            apiToken: accessToken,
                                            refreshToken: newRefreshToken || cred.refreshToken,
                                        },
                                    });

                                    if (cred.dbId) {
                                        const { host, session: newSession } = await refreshSession(
                                            accessToken,
                                            cred.dbId,
                                        );
                                        cred = await prisma.accurateCredentials.update({
                                            where: { id: cred.id },
                                            data: { host, session: newSession },
                                        });
                                    }

                                    // Retry once
                                    response = await listInventoryAdjustments(
                                        {
                                            apiToken: cred.apiToken,
                                            signatureSecret: cred.signatureSecret,
                                            host: cred.host!,
                                            session: cred.session!,
                                        },
                                        page,
                                        100,
                                        { startDate: startDateStr },
                                    );
                                } else {
                                    throw err;
                                }
                            }

                            if (response.d && response.d.length > 0) {
                                // Filter self-checkout adjustments
                                const selfCheckouts = response.d.filter(
                                    (adj) => adj.description?.includes("Self Checkout"),
                                );

                                selfCheckouts.forEach((adj) => {
                                    allSelfCheckoutIds.push({
                                        id: adj.id,
                                        transDate: adj.transDate,
                                        description: adj.description || "",
                                    });
                                });

                                // Check if there are more pages
                                if (response.sp && page < response.sp.pageCount) {
                                    page++;
                                } else {
                                    hasMore = false;
                                }
                            } else {
                                hasMore = false;
                            }
                        }

                        console.log(
                            `[sync-kiosk] Found ${allSelfCheckoutIds.length} self-checkout adjustments for credential ${cred.id}`,
                        );

                        // Process each self-checkout adjustment
                        for (const adj of allSelfCheckoutIds) {
                            totalCheckouts++;

                            // Parse user info from description
                            const nameMatch = adj.description.match(
                                /Self Checkout by (.*?)(?: \||$)/,
                            );
                            const emailMatch = adj.description.match(
                                /Email: (.*?)(?: \||$)/,
                            );

                            const name = nameMatch ? nameMatch[1].trim() : "Unknown";
                            const email = emailMatch
                                ? emailMatch[1].trim()
                                : "unknown@kiosk";

                            const existing = usersByEmail.get(email);
                            if (existing) {
                                existing.count++;
                            } else {
                                usersByEmail.set(email, { email, name, count: 1 });
                            }

                            // Track daily counts
                            if (adj.transDate) {
                                // DD/MM/YYYY -> YYYY-MM-DD
                                const dayKey = adj.transDate
                                    .split("/")
                                    .reverse()
                                    .join("-");
                                dailyCounts.set(dayKey, (dailyCounts.get(dayKey) || 0) + 1);
                            }

                            // Fetch detail to get items
                            try {
                                const detail = await getInventoryAdjustmentDetail(
                                    {
                                        apiToken: cred.apiToken,
                                        signatureSecret: cred.signatureSecret,
                                        host: cred.host!,
                                        session: cred.session!,
                                    },
                                    adj.id,
                                );

                                if (detail?.detailItem) {
                                    detail.detailItem.forEach((di) => {
                                        const code = di.item?.no || "UNKNOWN";
                                        const name = di.item?.name || code;
                                        const qty = di.quantity || 1;

                                        const existingItem = itemsByCode.get(code);
                                        if (existingItem) {
                                            existingItem.totalQuantity += qty;
                                        } else {
                                            itemsByCode.set(code, {
                                                itemCode: code,
                                                itemName: name,
                                                totalQuantity: qty,
                                            });
                                        }
                                    });
                                }

                                // Small delay to avoid rate limiting
                                await delay(200);
                            } catch (detailErr) {
                                console.error(
                                    `[sync-kiosk] Failed to fetch detail for adjustment ${adj.id}:`,
                                    detailErr,
                                );
                            }
                        }
                    } catch (credErr: any) {
                        console.error(
                            `[sync-kiosk] Error processing credential ${cred.id}:`,
                            credErr.message,
                        );
                    }
                }

                // Build final aggregated data
                const topUsers = Array.from(usersByEmail.values())
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                const topItems = Array.from(itemsByCode.values())
                    .sort((a, b) => b.totalQuantity - a.totalQuantity)
                    .slice(0, 10);

                const dailyData = Array.from(dailyCounts.entries())
                    .map(([date, count]) => ({ date, count }))
                    .sort((a, b) => a.date.localeCompare(b.date));

                const uniqueUsers = usersByEmail.size;

                // Upsert cache
                if ((prisma as any).kioskSyncData) {
                    await (prisma as any).kioskSyncData.upsert({
                        where: {
                            userId_year_month: {
                                userId: user.id,
                                year,
                                month,
                            },
                        },
                        update: {
                            totalCheckouts: totalCheckouts,
                            uniqueUsers,
                            topUsers: topUsers as any,
                            topItems: topItems as any,
                            dailyData: dailyData as any,
                            lastSyncAt: now,
                        },
                        create: {
                            userId: user.id,
                            year,
                            month,
                            totalCheckouts: totalCheckouts,
                            uniqueUsers,
                            topUsers: topUsers as any,
                            topItems: topItems as any,
                            dailyData: dailyData as any,
                            lastSyncAt: now,
                        },
                    });
                } else {
                    console.error('[sync-kiosk] kioskSyncData model not found on prisma client');
                    throw new Error('Database model not ready. Please try again in a few seconds.');
                }


                console.log(
                    `[sync-kiosk] ✅ Synced for ${user.email}: ${totalCheckouts} checkouts, ${uniqueUsers} users, ${topItems.length} items`,
                );
                results.push({ userId: user.id, status: "ok" });
            } catch (userErr: any) {
                console.error(
                    `[sync-kiosk] ❌ Failed for ${user.email}:`,
                    userErr.message,
                );
                results.push({
                    userId: user.id,
                    status: "error",
                    error: userErr.message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            syncedAt: now.toISOString(),
            results,
        });
    } catch (error: any) {
        console.error("[sync-kiosk] Fatal error:", error);
        return NextResponse.json(
            { error: error.message || "Sync failed" },
            { status: 500 },
        );
    }
}
