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
