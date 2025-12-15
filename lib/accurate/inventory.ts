import { accurateFetch } from "./client";

interface AccurateCredentials {
  apiToken: string;
  signatureSecret: string;
  host: string;
}

export interface InventoryAdjustment {
  id: number;
  transDate: string;
  number: string;
  description?: string;
  status?: string;
}

export interface InventoryAdjustmentDetail {
  id: number;
  transDate: string;
  number: string;
  description?: string;
  detailItem: Array<{
    id: number;
    item: {
      id: number;
      name: string;
      no: string;
    };
    unitPrice: number;
    quantity: number;
    unit: {
      name: string;
    };
    warehouse?: {
      name: string;
    };
    type?: string; // Penambahan or Pengurangan
  }>;
}

export interface InventoryAdjustmentListResponse {
  d: InventoryAdjustment[];
  sp: {
    page: number;
    pageSize: number;
    pageCount: number;
  };
}

export interface ItemResponse {
  d: Array<{
    id: number;
    name: string;
    no: string;
  }>;
}

/**
 * List inventory adjustments with pagination
 */
export async function listInventoryAdjustments(
  credentials: AccurateCredentials,
  page: number = 1,
  pageSize: number = 100,
  filter?: {
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
  }
): Promise<InventoryAdjustmentListResponse> {
  const params = new URLSearchParams({
    "sp.page": page.toString(),
    "sp.pageSize": pageSize.toString(),
  });

  if (filter?.startDate) {
    params.append("filter.transDate.start", filter.startDate);
  }

  if (filter?.endDate) {
    params.append("filter.transDate.end", filter.endDate);
  }

  return accurateFetch<InventoryAdjustmentListResponse>(
    `/api/inventory-adjustment/list.do?${params.toString()}`,
    credentials,
    { method: "GET" }
  );
}

/**
 * Get inventory adjustment detail by ID
 */
export async function getInventoryAdjustmentDetail(
  credentials: AccurateCredentials,
  id: number
): Promise<InventoryAdjustmentDetail> {
  const response = await accurateFetch<{ d: InventoryAdjustmentDetail }>(
    `/api/inventory-adjustment/detail.do?id=${id}`,
    credentials,
    { method: "GET" }
  );

  return response.d;
}

/**
 * Save inventory adjustment (for import)
 */
export async function saveInventoryAdjustment(
  credentials: AccurateCredentials,
  data: {
    transDate: string; // YYYY-MM-DD
    number?: string;
    description?: string;
    detailItem: Array<{
      itemId: number;
      quantity: number;
      unitId?: number;
      warehouseId?: number;
      type?: string; // "Penambahan" or "Pengurangan"
    }>;
  }
): Promise<{ id: number }> {
  const response = await accurateFetch<{ d: { id: number } }>(
    `/api/inventory-adjustment/save.do`,
    credentials,
    {
      method: "POST",
      body: data,
    }
  );

  return response.d;
}

/**
 * Search for item by code
 */
export async function findItemByCode(
  credentials: AccurateCredentials,
  itemCode: string
): Promise<{ id: number; name: string; no: string } | null> {
  const response = await accurateFetch<ItemResponse>(
    `/api/item/list.do?filter.no.op=EQUAL&filter.no.val[0]=${encodeURIComponent(itemCode)}`,
    credentials,
    { method: "GET" }
  );

  return response.d.length > 0 ? response.d[0] : null;
}

/**
 * Export all inventory adjustments for a date range
 */
export async function exportInventoryAdjustments(
  credentials: AccurateCredentials,
  startDate: string,
  endDate: string
): Promise<
  Array<{
    adjustmentNumber: string;
    date: string;
    itemName: string;
    itemCode: string;
    type: string;
    quantity: number;
    unit: string;
    warehouse?: string;
    description?: string;
  }>
> {
  const allRecords: Array<any> = [];
  let page = 1;
  let hasMore = true;

  // Fetch all pages
  while (hasMore) {
    const response = await listInventoryAdjustments(credentials, page, 100, {
      startDate,
      endDate,
    });

    if (response.d.length === 0) {
      hasMore = false;
      break;
    }

    // Fetch details for each adjustment
    for (const adjustment of response.d) {
      const detail = await getInventoryAdjustmentDetail(
        credentials,
        adjustment.id
      );

      // Flatten item lines
      for (const item of detail.detailItem) {
        allRecords.push({
          adjustmentNumber: detail.number,
          date: detail.transDate,
          itemName: item.item.name,
          itemCode: item.item.no,
          type: item.type || "",
          quantity: item.quantity,
          unit: item.unit.name,
          warehouse: item.warehouse?.name || "",
          description: detail.description || "",
        });
      }
    }

    // Check if there are more pages
    if (page >= response.sp.pageCount) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allRecords;
}
