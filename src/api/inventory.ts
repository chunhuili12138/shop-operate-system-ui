import { http } from "@/utils/http";
import { ApiResult } from "@/types/api";

// ========== 库存管理相关 ==========

// 库存查询参数
export interface InventoryQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
}

// 库存列表响应
export interface InventoryListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      material_id: string;
      material_name: string;
      sku: string;
      quantity: number;
      unit: string;
      min_stock: number;
    }>;
    total: number;
  };
  timestamp: number;
}

// 出入库表单参数
export interface InventoryIoParams {
  materialId: string;
  quantity: string;
  remark?: string;
}

// 库存流水查询参数
export interface InventoryTransactionQueryParams {
  materialId: string;
  page?: number;
  size?: number;
}

// 库存流水列表响应
export interface InventoryTransactionListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      transaction_type: number;
      quantity: number;
      balance_after: number;
      remark: string;
      created_at: string;
    }>;
    total: number;
  };
  timestamp: number;
}

/** 获取库存列表 */
export const getInventoryList = (params?: InventoryQueryParams) => {
  return http.request<InventoryListResult>("get", "/inventory/page", { params });
};

/** 获取库存预警列表 */
export const getInventoryWarnings = () => {
  return http.request<ApiResult>("get", "/inventory/warnings");
};

/** 入库 */
export const inventoryInbound = (data: InventoryIoParams) => {
  return http.request<ApiResult>("post", "/inventoryInbound", { data });
};

/** 出库 */
export const inventoryOutbound = (data: InventoryIoParams) => {
  return http.request<ApiResult>("post", "/inventoryOutbound", { data });
};

/** 获取库存流水 */
export const getInventoryTransactions = (params?: InventoryTransactionQueryParams) => {
  return http.request<InventoryTransactionListResult>("get", "/inventoryTransactions", { params });
};

// ========== 物料管理相关 ==========

// 物料查询参数
export interface MaterialQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  type?: number | string;
  category?: string;
}

// 物料列表响应
export interface MaterialListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      name: string;
      sku: string;
      category: string;
      unit: string;
      type: number;
      min_stock: number;
      remark: string;
    }>;
    total: number;
  };
  timestamp: number;
}

// 物料表单参数
export interface MaterialFormParams {
  materialId?: number | null;
  name: string;
  sku: string;
  category: string;
  unit: string;
  type: number;
  minStock: number | null;
  remark: string;
}

/** 获取物料列表 */
export const getMaterialList = (params?: MaterialQueryParams) => {
  return http.request<MaterialListResult>("get", "/materials", { params });
};

/** 新增物料 */
export const addMaterial = (data: MaterialFormParams) => {
  return http.request<ApiResult>("post", "/materialsAdd", { data });
};

/** 更新物料 */
export const updateMaterial = (data: MaterialFormParams) => {
  return http.request<ApiResult>("put", "/materialsUpdate", { data });
};

/** 删除物料 */
export const deleteMaterial = (materialId: number) => {
  return http.request<ApiResult>("delete", "/materialsDelete", { 
    params: { materialId } 
  });
};

// ========== 采购管理相关 ==========

// 采购单查询参数
export interface PurchaseOrderQueryParams {
  page?: number;
  size?: number;
  status?: number | string;
}

// 采购单列表响应
export interface PurchaseOrderListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      order_number: string;
      supplier_name: string;
      total_amount: number;
      paid_amount: number;
      status: number;
    }>;
    total: number;
  };
  timestamp: number;
}

// 供应商列表响应
export interface SupplierListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      name: string;
    }>;
    total: number;
  };
  timestamp: number;
}

// 采购单表单参数
export interface PurchaseOrderFormParams {
  supplierId: string;
  orderDate: string;
  type: number;
  remark: string;
  items: any[];
}

// 更新采购单状态参数
export interface UpdatePurchaseOrderStatusParams {
  orderId: number;
  status: number;
}

// 采购单付款参数
export interface PayPurchaseOrderParams {
  orderId: number;
  amount: string;
  paymentMethod: string;
  paidAt: string;
}

// 采购明细列表响应
export interface PurchaseOrderItemListResult {
  success: boolean;
  code: number;
  msg: string;
  data: Array<{
    material_name: string;
    quantity: number;
    unit_price: number;
  }>;
  timestamp: number;
}

/** 获取采购单列表 */
export const getPurchaseOrderList = (params?: PurchaseOrderQueryParams) => {
  return http.request<PurchaseOrderListResult>("get", "/purchaseOrders", { params });
};

/** 获取供应商列表 */
export const getSupplierList = (page = 1, size = 999) => {
  return http.request<SupplierListResult>("get", "/suppliers", { 
    params: { page, size } 
  });
};

/** 新增采购单 */
export const addPurchaseOrder = (data: PurchaseOrderFormParams) => {
  return http.request<ApiResult>("post", "/purchaseOrdersAdd", { data });
};

/** 更新采购单状态 */
export const updatePurchaseOrderStatus = (data: UpdatePurchaseOrderStatusParams) => {
  return http.request<ApiResult>("put", "/purchaseOrdersStatus", { data });
};

/** 获取采购明细 */
export const getPurchaseOrderItems = (orderId: number) => {
  return http.request<PurchaseOrderItemListResult>("get", "/purchaseOrdersItems", { 
    params: { orderId } 
  });
};

/** 采购单付款 */
export const payPurchaseOrder = (data: PayPurchaseOrderParams) => {
  return http.request<ApiResult>("post", "/purchaseOrdersPay", { data });
};
