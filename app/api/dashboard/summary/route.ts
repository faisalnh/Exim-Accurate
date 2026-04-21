import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalExports,
      totalImports,
      connectedAccounts,
      thisMonthExports,
      thisMonthImports,
      lastMonthExports,
      lastMonthImports,
      recentExports,
      recentImports,
    ] = await Promise.all([
      prisma.exportJob.count({
        where: { status: "done" },
      }),
      prisma.importJob.count({
        where: { status: "done" },
      }),
      prisma.accurateCredentials.count({
        where: {},
      }),
      prisma.exportJob.count({
        where: {
          status: "done",
          startedAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
      }),
      prisma.importJob.count({
        where: {
          status: "done",
          startedAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
      }),
      prisma.exportJob.count({
        where: {
          status: "done",
          startedAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      prisma.importJob.count({
        where: {
          status: "done",
          startedAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      prisma.exportJob.findMany({
        where: {},
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          startedAt: true,
          completedAt: true,
        },
      }),
      prisma.importJob.findMany({
        where: {},
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          startedAt: true,
          completedAt: true,
        },
      }),
    ]);

    // Read kiosk data from cache (synced by /api/cron/sync-kiosk)
    let kioskCaches: any[] = [];
    if ((prisma as any).kioskSyncData) {
      kioskCaches = await (prisma as any).kioskSyncData.findMany({
        where: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      });
    } else {
      console.warn('[dashboard/summary] kioskSyncData model not found on prisma client yet');
    }

    const totalKioskCheckouts = kioskCaches.reduce(
      (sum, cache) => sum + (cache.totalCheckouts || 0),
      0,
    );

    const topUsersByEmail = new Map<string, { email: string; name: string | null; count: number }>();
    const topItemsByCode = new Map<string, { itemCode: string; itemName: string; totalQuantity: number }>();
    const dailyCountMap = new Map<string, number>();
    let kioskLastSync: string | null = null;

    for (const cache of kioskCaches) {
      if (!kioskLastSync || new Date(cache.lastSyncAt).getTime() > new Date(kioskLastSync).getTime()) {
        kioskLastSync = cache.lastSyncAt;
      }

      for (const user of ((cache.topUsers as any[]) || [])) {
        const key = user.email || "unknown@kiosk";
        const existing = topUsersByEmail.get(key);
        if (existing) {
          existing.count += user.count || 0;
          if (!existing.name && user.name) {
            existing.name = user.name;
          }
        } else {
          topUsersByEmail.set(key, {
            email: key,
            name: user.name || null,
            count: user.count || 0,
          });
        }
      }

      for (const item of ((cache.topItems as any[]) || [])) {
        const key = item.itemCode || "UNKNOWN";
        const existing = topItemsByCode.get(key);
        if (existing) {
          existing.totalQuantity += item.totalQuantity || 0;
        } else {
          topItemsByCode.set(key, {
            itemCode: key,
            itemName: item.itemName || key,
            totalQuantity: item.totalQuantity || 0,
          });
        }
      }

      for (const day of ((cache.dailyData as any[]) || [])) {
        if (!day?.date) continue;
        dailyCountMap.set(day.date, (dailyCountMap.get(day.date) || 0) + (day.count || 0));
      }
    }

    const cachedTopUsers = Array.from(topUsersByEmail.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const uniqueKioskUsers = topUsersByEmail.size;
    const topKioskUser = cachedTopUsers.length > 0 ? cachedTopUsers[0] : null;
    const topCheckoutUsers = cachedTopUsers.map((user: any, idx: number) => ({
      rank: idx + 1,
      email: user.email,
      name: user.name || null,
      count: user.count || 0,
    }));
    const topItems = Array.from(topItemsByCode.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5)
      .map((item: any, idx: number) => ({
      rank: idx + 1,
      itemCode: item.itemCode,
      itemName: item.itemName || item.itemCode,
      totalQuantity: item.totalQuantity || 0,
    }));

    // Build kiosk weekly chart data (last 7 days) from cached daily data
    const kioskWeeklyData: { name: string; checkouts: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
      kioskWeeklyData.push({
        name: dayLabel,
        checkouts: dailyCountMap.get(key) || 0,
      });
    }

    const thisMonthTotal = thisMonthExports + thisMonthImports;
    const lastMonthTotal = lastMonthExports + lastMonthImports;

    const stats = {
      totalExports,
      totalImports,
      connectedAccounts,
      thisMonth: thisMonthTotal,
      exportsTrend: percentChange(thisMonthExports, lastMonthExports),
      importsTrend: percentChange(thisMonthImports, lastMonthImports),
      monthTrend: percentChange(thisMonthTotal, lastMonthTotal),
    };

    const weekStart = startOfDay(now);
    weekStart.setDate(weekStart.getDate() - 6);

    const [weeklyExports, weeklyImports] = await Promise.all([
      prisma.exportJob.findMany({
        where: {
          status: "done",
          startedAt: { gte: weekStart },
        },
        select: { startedAt: true },
      }),
      prisma.importJob.findMany({
        where: {
          status: "done",
          startedAt: { gte: weekStart },
        },
        select: { startedAt: true },
      }),
    ]);

    const weeklyMap = new Map<
      string,
      { name: string; exports: number; imports: number }
    >();

    for (let i = 0; i < 7; i += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weeklyMap.set(dateKey(date), {
        name: date.toLocaleDateString("id-ID", { weekday: "short" }),
        exports: 0,
        imports: 0,
      });
    }

    weeklyExports.forEach((job) => {
      const key = dateKey(job.startedAt);
      const entry = weeklyMap.get(key);
      if (entry) entry.exports += 1;
    });

    weeklyImports.forEach((job) => {
      const key = dateKey(job.startedAt);
      const entry = weeklyMap.get(key);
      if (entry) entry.imports += 1;
    });

    const weeklyActivityData = Array.from(weeklyMap.values());

    const monthJobs = await prisma.exportJob.findMany({
      where: {
        status: "done",
        startedAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      select: { startedAt: true },
    });

    const monthImports = await prisma.importJob.findMany({
      where: {
        status: "done",
        startedAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      select: { startedAt: true },
    });

    const monthlyBuckets = [
      { name: "Minggu 1", total: 0 },
      { name: "Minggu 2", total: 0 },
      { name: "Minggu 3", total: 0 },
      { name: "Minggu 4", total: 0 },
    ];

    const bucketIndex = (date: Date) => {
      const day = date.getDate();
      if (day <= 7) return 0;
      if (day <= 14) return 1;
      if (day <= 21) return 2;
      return 3;
    };

    monthJobs.forEach((job) => {
      monthlyBuckets[bucketIndex(job.startedAt)].total += 1;
    });

    monthImports.forEach((job) => {
      monthlyBuckets[bucketIndex(job.startedAt)].total += 1;
    });

    const activities = [
      ...recentExports.map((job) => {
        return {
          id: job.id,
          type: "export",
          title:
            job.type === "inventory_adjustment"
              ? "Ekspor penyesuaian persediaan"
              : `Ekspor ${job.type}`,
          description: undefined,
          timestamp: job.completedAt ?? job.startedAt,
          status:
            job.status === "done"
              ? "success"
              : job.status === "error"
                ? "error"
                : "pending",
          metadata: undefined,
        };
      }),
      ...recentImports.map((job) => {
        return {
          id: job.id,
          type: "import",
          title:
            job.type === "inventory_adjustment"
              ? "Impor penyesuaian persediaan"
              : `Impor ${job.type}`,
          description: undefined,
          timestamp: job.completedAt ?? job.startedAt,
          status:
            job.status === "done"
              ? "success"
              : job.status === "error"
                ? "error"
                : "pending",
          metadata: undefined,
        };
      }),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 5);

    return NextResponse.json({
      stats,
      kioskStats: {
        totalCheckouts: totalKioskCheckouts,
        uniqueUsers: uniqueKioskUsers,
        topUser: topKioskUser,
      },
      topCheckoutUsers,
      topItems,
      kioskWeeklyData,
      kioskLastSync,
      weeklyActivityData,
      monthlyTrendData: monthlyBuckets,
      monthTotal: thisMonthTotal,
      activities,
    });
  } catch (error) {
    console.error("Gagal menyusun ringkasan dasbor", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P1001"
    ) {
      return NextResponse.json(
        { error: "Database tidak dapat diakses. Coba lagi beberapa saat." },
        { status: 503 },
      );
    }

    const detail =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan tidak terduga";
    return NextResponse.json(
      { error: `Gagal memuat ringkasan dasbor: ${detail}` },
      { status: 500 },
    );
  }
}
