import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
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
        where: { userId, status: "done" },
      }),
      prisma.importJob.count({
        where: { userId, status: "done" },
      }),
      prisma.accurateCredentials.count({
        where: { userId },
      }),
      prisma.exportJob.count({
        where: {
          userId,
          status: "done",
          startedAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
      }),
      prisma.importJob.count({
        where: {
          userId,
          status: "done",
          startedAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
      }),
      prisma.exportJob.count({
        where: {
          userId,
          status: "done",
          startedAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      prisma.importJob.count({
        where: {
          userId,
          status: "done",
          startedAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      prisma.exportJob.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          startedAt: true,
          completedAt: true,
          format: true,
          recordCount: true,
        },
      }),
      prisma.importJob.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          startedAt: true,
          completedAt: true,
          format: true,
          fileName: true,
          recordCount: true,
          successCount: true,
          failedCount: true,
        },
      }),
    ]);

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
          userId,
          status: "done",
          startedAt: { gte: weekStart },
        },
        select: { startedAt: true },
      }),
      prisma.importJob.findMany({
        where: {
          userId,
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
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
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
        userId,
        status: "done",
        startedAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      select: { startedAt: true },
    });

    const monthImports = await prisma.importJob.findMany({
      where: {
        userId,
        status: "done",
        startedAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      select: { startedAt: true },
    });

    const monthlyBuckets = [
      { name: "Week 1", total: 0 },
      { name: "Week 2", total: 0 },
      { name: "Week 3", total: 0 },
      { name: "Week 4", total: 0 },
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
        const descriptionParts: string[] = [];
        if (job.format) descriptionParts.push(job.format.toUpperCase());
        if (job.recordCount !== null && job.recordCount !== undefined) {
          descriptionParts.push(`${job.recordCount} records`);
        }

        return {
          id: job.id,
          type: "export",
          title:
            job.type === "inventory_adjustment"
              ? "Exported inventory adjustments"
              : `Exported ${job.type}`,
          description:
            descriptionParts.length > 0
              ? descriptionParts.join(" · ")
              : undefined,
          timestamp: job.completedAt ?? job.startedAt,
          status:
            job.status === "done"
              ? "success"
              : job.status === "error"
                ? "error"
                : "pending",
          metadata:
            job.recordCount !== null && job.recordCount !== undefined
              ? { count: job.recordCount }
              : undefined,
        };
      }),
      ...recentImports.map((job) => {
        const descriptionParts: string[] = [];
        if (job.fileName) descriptionParts.push(job.fileName);
        if (job.recordCount !== null && job.recordCount !== undefined) {
          descriptionParts.push(`${job.recordCount} rows`);
        }
        if (
          job.successCount !== null &&
          job.successCount !== undefined &&
          job.failedCount !== null &&
          job.failedCount !== undefined
        ) {
          descriptionParts.push(
            `Success ${job.successCount} / Failed ${job.failedCount}`,
          );
        }

        return {
          id: job.id,
          type: "import",
          title:
            job.type === "inventory_adjustment"
              ? "Imported inventory adjustments"
              : `Imported ${job.type}`,
          description:
            descriptionParts.length > 0
              ? descriptionParts.join(" · ")
              : undefined,
          timestamp: job.completedAt ?? job.startedAt,
          status:
            job.status === "done"
              ? "success"
              : job.status === "error"
                ? "error"
                : "pending",
          metadata:
            job.recordCount !== null && job.recordCount !== undefined
              ? { count: job.recordCount }
              : undefined,
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
      weeklyActivityData,
      monthlyTrendData: monthlyBuckets,
      monthTotal: thisMonthTotal,
      activities,
    });
  } catch (error) {
    console.error("Failed to build dashboard summary", error);
    return NextResponse.json(
      { error: "Failed to load dashboard summary" },
      { status: 500 },
    );
  }
}
