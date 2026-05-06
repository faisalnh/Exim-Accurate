import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapToRankedRows, paginate, parseAnalyticsFilters, serializeFilters } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  try {
    const filters = await parseAnalyticsFilters(req);

    const borrowingWhere: any = {
      borrowedAt: { gte: filters.startDate, lte: filters.endDate },
    };
    const checkoutWhere: any = {
      createdAt: { gte: filters.startDate, lte: filters.endDate },
    };
    if (filters.credentialId) {
      borrowingWhere.credentialId = filters.credentialId;
      checkoutWhere.credentialId = filters.credentialId;
    }
    if (filters.itemCode) {
      borrowingWhere.items = { some: { itemCode: filters.itemCode } };
      checkoutWhere.items = { some: { itemCode: filters.itemCode } };
    }

    const [borrowingRows, checkoutRows, borrowableItems] = await Promise.all([
      prisma.borrowingSession.findMany({ where: borrowingWhere, include: { items: true } }),
      prisma.checkoutSession.findMany({ where: checkoutWhere, include: { items: true } }),
      prisma.borrowableItem.findMany(),
    ]);

    const borrowedMap = new Map<string, { total: number; data: { itemCode: string; itemName: string } }>();
    const returnedMap = new Map<string, number>();
    const checkedOutMap = new Map<string, { total: number; data: { itemCode: string; itemName: string } }>();

    for (const row of borrowingRows) {
      for (const item of row.items) {
        const entry = borrowedMap.get(item.itemCode) || {
          total: 0,
          data: { itemCode: item.itemCode, itemName: item.itemName },
        };
        entry.total += item.quantity;
        borrowedMap.set(item.itemCode, entry);
        returnedMap.set(item.itemCode, (returnedMap.get(item.itemCode) || 0) + item.returnedQty);
      }
    }

    for (const row of checkoutRows) {
      for (const item of row.items) {
        const entry = checkedOutMap.get(item.itemCode) || {
          total: 0,
          data: { itemCode: item.itemCode, itemName: item.itemName || item.itemCode },
        };
        entry.total += item.quantity;
        checkedOutMap.set(item.itemCode, entry);
      }
    }

    const allCodes = new Set<string>([
      ...borrowedMap.keys(),
      ...checkedOutMap.keys(),
      ...borrowableItems.map((item) => item.itemCode),
    ]);

    const details = Array.from(allCodes).map((itemCode) => {
      const borrowable = borrowableItems.find((item) => item.itemCode === itemCode);
      const borrowed = borrowedMap.get(itemCode);
      const checkedOut = checkedOutMap.get(itemCode);
      const borrowedQty = borrowed?.total || 0;
      const returnedQty = returnedMap.get(itemCode) || 0;
      const checkedOutQty = checkedOut?.total || 0;
      const totalUsage = borrowedQty + checkedOutQty;
      const stock = borrowable?.totalStock || 0;

      return {
        itemCode,
        itemName: borrowable?.itemName || borrowed?.data.itemName || checkedOut?.data.itemName || itemCode,
        totalStock: stock,
        borrowedQty,
        returnedQty,
        activeBorrowedQty: Math.max(0, borrowedQty - returnedQty),
        checkedOutQty,
        totalUsage,
        pressure: stock > 0 ? Math.round(((borrowedQty - returnedQty + checkedOutQty) / stock) * 100) : null,
      };
    });

    return NextResponse.json({
      filters: serializeFilters(filters),
      summary: {
        uniqueResources: details.length,
        totalBorrowed: details.reduce((sum, row) => sum + row.borrowedQty, 0),
        totalReturned: details.reduce((sum, row) => sum + row.returnedQty, 0),
        totalCheckedOut: details.reduce((sum, row) => sum + row.checkedOutQty, 0),
      },
      topBorrowed: mapToRankedRows(borrowedMap),
      topCheckedOut: mapToRankedRows(checkedOutMap),
      borrowedVsReturned: details.map((row) => ({
        name: row.itemCode,
        borrowed: row.borrowedQty,
        returned: row.returnedQty,
      })),
      availabilityPressure: details
        .filter((row) => row.pressure !== null)
        .sort((a, b) => (b.pressure || 0) - (a.pressure || 0))
        .slice(0, 10),
      leastUsed: details.slice().sort((a, b) => a.totalUsage - b.totalUsage).slice(0, 10),
      details: paginate(details.sort((a, b) => b.totalUsage - a.totalUsage), filters.page, filters.pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat analytics resources";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
