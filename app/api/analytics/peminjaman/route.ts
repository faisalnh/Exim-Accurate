import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  incrementMap,
  mapToRankedRows,
  paginate,
  parseAnalyticsFilters,
  serializeFilters,
  sumBy,
  trendKey,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

type BorrowingSessionRow = Awaited<ReturnType<typeof prisma.borrowingSession.findMany>>[number] & {
  items: {
    id: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    returnedQty: number;
    returnedAt: Date | null;
  }[];
};

function isOverdue(row: { status: string; dueAt: Date | null }) {
  return ["active", "partial"].includes(row.status) && row.dueAt !== null && row.dueAt < new Date();
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  try {
    const filters = await parseAnalyticsFilters(req);
    const where: any = {
      borrowedAt: { gte: filters.startDate, lte: filters.endDate },
    };

    if (filters.credentialId) where.credentialId = filters.credentialId;
    if (filters.email) where.borrowerEmail = { contains: filters.email, mode: "insensitive" };
    if (filters.status) where.status = filters.status;
    if (filters.itemCode) where.items = { some: { itemCode: filters.itemCode } };

    const rows = (await prisma.borrowingSession.findMany({
      where,
      include: { items: true },
      orderBy: { borrowedAt: "desc" },
    })) as BorrowingSessionRow[];

    const activitiesWhere: any = {
      occurredAt: { gte: filters.startDate, lte: filters.endDate },
    };
    if (filters.credentialId) activitiesWhere.credentialId = filters.credentialId;
    if (filters.email) activitiesWhere.borrowerEmail = { contains: filters.email, mode: "insensitive" };
    if (filters.itemCode) activitiesWhere.itemCode = filters.itemCode;

    const activities = await prisma.borrowingActivity.findMany({
      where: activitiesWhere,
      orderBy: { occurredAt: "asc" },
      take: 5000,
    });

    const totalQuantity = rows.reduce(
      (sum, row) => sum + row.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );
    const returnedQuantity = rows.reduce(
      (sum, row) => sum + row.items.reduce((itemSum, item) => itemSum + item.returnedQty, 0),
      0,
    );

    const summary = {
      totalSessions: rows.length,
      active: rows.filter((row) => row.status === "active").length,
      partial: rows.filter((row) => row.status === "partial").length,
      returned: rows.filter((row) => row.status === "returned").length,
      booked: rows.filter((row) => row.type === "booking").length,
      overdue: rows.filter(isOverdue).length,
      totalQuantity,
      returnedQuantity,
    };

    const trendMap = new Map<string, { borrow: number; booking: number; return: number }>();
    for (const activity of activities) {
      const key = trendKey(activity.occurredAt, filters.groupBy);
      const current = trendMap.get(key) || { borrow: 0, booking: 0, return: 0 };
      if (activity.activityType === "return") current.return += activity.quantity;
      else if (activity.activityType === "booking") current.booking += activity.quantity;
      else current.borrow += activity.quantity;
      trendMap.set(key, current);
    }

    const statusBreakdown = sumBy(rows, (row) => row.status, () => 1);
    const typeBreakdown = sumBy(rows, (row) => row.type || "borrow", () => 1);

    const itemMap = new Map<string, { total: number; data: { itemCode: string; itemName: string } }>();
    const borrowerMap = new Map<string, { total: number; data: { email: string; name: string | null } }>();
    for (const row of rows) {
      const borrowerTotal = row.items.reduce((sum, item) => sum + item.quantity, 0);
      const borrower = borrowerMap.get(row.borrowerEmail) || {
        total: 0,
        data: { email: row.borrowerEmail, name: row.borrowerName },
      };
      borrower.total += borrowerTotal;
      borrowerMap.set(row.borrowerEmail, borrower);

      for (const item of row.items) {
        const itemEntry = itemMap.get(item.itemCode) || {
          total: 0,
          data: { itemCode: item.itemCode, itemName: item.itemName },
        };
        itemEntry.total += item.quantity;
        itemMap.set(item.itemCode, itemEntry);
      }
    }

    const details = rows.flatMap((row) =>
      row.items.map((item) => ({
        sessionId: row.id,
        borrowedAt: row.borrowedAt,
        startsAt: row.startsAt,
        dueAt: row.dueAt,
        returnedAt: row.returnedAt,
        type: row.type,
        status: row.status,
        borrowerEmail: row.borrowerEmail,
        borrowerName: row.borrowerName,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.quantity,
        returnedQty: item.returnedQty,
        overdue: isOverdue(row),
      })),
    );

    return NextResponse.json({
      filters: serializeFilters(filters),
      summary,
      trend: Array.from(trendMap.entries()).map(([name, values]) => ({ name, ...values })),
      statusBreakdown,
      typeBreakdown,
      topItems: mapToRankedRows(itemMap),
      topBorrowers: mapToRankedRows(borrowerMap),
      overdue: details.filter((detail) => detail.overdue),
      details: paginate(details, filters.page, filters.pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat analytics peminjaman";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
