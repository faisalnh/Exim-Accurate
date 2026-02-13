"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — List borrowing sessions with filters
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const credentialId = searchParams.get("credentialId");
    const status = searchParams.get("status") || "all"; // active, returned, partial, all
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (!credentialId) {
        return NextResponse.json({ error: "credentialId is required" }, { status: 400 });
    }

    try {
        const where: any = {
            userId: session.user.id,
            credentialId,
        };

        if (status !== "all") {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { borrowerEmail: { contains: search, mode: "insensitive" } },
                { borrowerName: { contains: search, mode: "insensitive" } },
                { items: { some: { itemCode: { contains: search, mode: "insensitive" } } } },
                { items: { some: { itemName: { contains: search, mode: "insensitive" } } } },
            ];
        }

        const [sessions, total] = await Promise.all([
            prisma.borrowingSession.findMany({
                where,
                include: {
                    items: true,
                },
                orderBy: { borrowedAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.borrowingSession.count({ where }),
        ]);

        return NextResponse.json({
            sessions,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error: any) {
        console.error("[peminjaman/sessions] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch sessions" }, { status: 500 });
    }
}
