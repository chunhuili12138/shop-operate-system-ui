import { http } from "@/utils/http";
import { ApiResult } from "@/types/api";

// 租户列表查询参数
export interface TenantQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  banStatus?: number | string;
}

// 租户信息
export interface TenantInfo {
  id: number;
  name: string;
  phone: string;
  used_seats?: number;
  max_seats?: number;
  shop_count?: number;
  role_names?: string;
  is_ban?: number;
  created_at?: string;
  remark?: string;
}

// 租户列表响应
export interface TenantListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: TenantInfo[];
    total: number;
  };
  timestamp: number;
}

// 租户创建/更新参数
export interface TenantFormParams {
  staffId?: number;
  name: string;
  phone: string;
  username?: string;
  password?: string;
  maxSeats?: number;
  remark?: string;
}

// 封禁状态参数
export interface BanStatusParams {
  staffId: number;
  banStatus: number;
}

/** 获取租户列表 */
export const getTenantList = (params?: TenantQueryParams) => {
  return http.request<TenantListResult>("get", "/admin/tenants/page", { params });
};

/** 删除租户 */
export const deleteTenant = (staffId: number) => {
  return http.request<ApiResult>("delete", "/admin/tenants/delete", { 
    params: { staffId } 
  });
};

/** 封禁/解封租户 */
export const updateTenantBanStatus = (data: BanStatusParams) => {
  return http.request<ApiResult>("put", "/admin/tenants/ban", { data });
};

/** 创建租户 */
export const createTenant = (data: TenantFormParams) => {
  return http.request<ApiResult>("post", "/admin/tenants/add", { data });
};

/** 更新租户 */
export const updateTenant = (data: TenantFormParams) => {
  return http.request<ApiResult>("put", "/admin/tenants/update", { data });
};

/** 重置租户密码 */
export const resetTenantPassword = (staffId: number, newPassword: string) => {
  return http.request<ApiResult>("post", "/admin/tenants/password", { 
    data: { staffId, newPassword } 
  });
};

// 席位列表响应
export interface SeatListResult {
  success: boolean;
  code: number;
  msg: string;
  data: Array<{
    id: number;
    seat_no: string;
    start_date: string;
    end_date: string;
    status: number;
    shop_names: string;
  }>;
  timestamp: number;
}

// 未绑定店铺的席位
export interface UnboundSeatResult {
  success: boolean;
  code: number;
  msg: string;
  data: Array<{
    id: number;
    seat_no: string;
    staff_id: number;
    staff_name: string;
    start_date: string;
    end_date: string;
    status: number;
  }>;
  timestamp: number;
}

// 席位表单参数
export interface SeatFormParams {
  staffId: number;
  subscriptionType: number;
  subscriptionNum: number;
  amount: number;
  paymentMethod: string;
}

// 席位续订参数
export interface SeatRenewParams {
  seatId: string;
  subscriptionType: number;
  subscriptionNum: number;
  amount: number;
  paymentMethod: string;
}

/** 获取席位列表 */
export const getSeatList = (staffId: number) => {
  return http.request<SeatListResult>("get", "/admin/tenants/seatList", { 
    params: { staffId } 
  });
};

/** 获取未绑定店铺的席位 */
export const getUnboundSeats = (staffId?: number) => {
  return http.request<UnboundSeatResult>("get", "/admin/tenants/unboundSeats", { 
    params: staffId ? { staffId } : {} 
  });
};

/** 新增席位 */
export const addSeat = (data: SeatFormParams) => {
  return http.request<ApiResult>("post", "/admin/tenants/seatAdd", { data });
};

/** 续订席位 */
export const renewSeat = (data: SeatRenewParams) => {
  return http.request<ApiResult>("post", "/admin/tenants/seatRenew", { data });
};

/** 删除席位 */
export const deleteSeat = (seatId: number) => {
  return http.request<ApiResult>("delete", "/admin/tenants/seatDelete", { 
    params: { seatId } 
  });
};

// 席位流水列表响应
export interface TransactionListResult {
  success: boolean;
  code: number;
  msg: string;
  data: Array<{
    id: number;
    seat_id: number;
    seat_no: string;
    amount: number;
    payment_method: string;
    subscription_type: number;
    subscription_num: number;
    status: number;
    refund_amount?: number;
    refund_days?: number;
    created_at: string;
  }>;
  timestamp: number;
}

// 退款参数
export interface RefundParams {
  transactionId: number;
  refundAmount: number;
  deductedDays: number;
}

/** 获取席位流水列表 */
export const getTransactionList = (staffId: number) => {
  return http.request<TransactionListResult>("get", "/admin/tenants/subscriptionTransactionList", { 
    params: { staffId } 
  });
};

/** 席位流水退款 */
export const refundTransaction = (data: RefundParams) => {
  return http.request<ApiResult>("put", "/admin/tenants/subscriptionTransactionRefund", { data });
};
