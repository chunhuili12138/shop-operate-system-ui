import { http } from "@/utils/http";
import type { ApiResult } from "@/types/api";

// 顾客查询参数
export interface CustomerQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  phone?: string;
  source?: string;
  tag?: string;
}

// 顾客信息
export interface CustomerInfo {
  id: number;
  shop_id?: number;
  nickname: string;
  phone: string;
  avatar_url?: string;
  gender?: number;
  birthday?: string;
  wechat_openid?: string;
  source?: string;
  tags?: string;
  remark?: string;
  created_at?: string;
}

// 顾客列表响应
export interface CustomerListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: CustomerInfo[];
    total: number;
  };
  timestamp: number;
}

// 顾客表单参数
export interface CustomerFormParams {
  customersId?: number | null;
  nickname: string;
  phone: string;
  gender?: number | null;
  birthday?: string;
  source?: string;
  remark?: string;
  tags?: string;
}

// 钱包调整参数
export interface WalletAdjustParams {
  customersId: number;
  type: number;
  amount: string | number;
  remark?: string;
}

// 积分调整参数
export interface PointsAdjustParams {
  customersId: number;
  points: number;
  remark?: string;
}

/** 获取顾客列表 */
export const getCustomerList = (params?: CustomerQueryParams) => {
  return http.request<CustomerListResult>("get", "/customers/page", { params });
};

/** 新增顾客 */
export const addCustomer = (data: CustomerFormParams) => {
  return http.request<ApiResult>("post", "/customers/add", { data });
};

/** 更新顾客 */
export const updateCustomer = (data: CustomerFormParams) => {
  return http.request<ApiResult>("put", "/customers/update", { data });
};

/** 删除顾客 */
export const deleteCustomer = (customersId: number) => {
  return http.request<ApiResult>("delete", "/customers/delete", {
    params: { customersId }
  });
};

/** 获取顾客详情 */
export const getCustomerInfo = (customersId: number) => {
  return http.request<ApiResult>("get", "/customers/info", {
    params: { customersId }
  });
};

/** 获取顾客钱包信息 */
export const getCustomerWallet = (customersId: number) => {
  return http.request<ApiResult>("get", "/customers/wallet", {
    params: { customersId }
  });
};

/** 获取顾客购买记录 */
export const getCustomerPurchases = (
  customersId: number,
  page = 1,
  size = 50
) => {
  return http.request<ApiResult>("get", "/customers/purchases", {
    params: { customersId, page, size }
  });
};

/** 获取顾客积分记录 */
export const getCustomerPoints = (customersId: number, page = 1, size = 50) => {
  return http.request<ApiResult>("get", "/customers/points", {
    params: { customersId, page, size }
  });
};

/** 钱包调整 */
export const adjustWallet = (data: WalletAdjustParams) => {
  return http.request<ApiResult>("post", "/customers/walletAdjust", { data });
};

// 充值参数（支持优惠券）
export interface RechargeParams {
  customersId: number;
  amount: number;
  paymentMethod?: string;
  couponUsageId?: number;
  remark?: string;
}

/** 钱包充值（支持优惠券抵扣） */
export const rechargeWallet = (data: RechargeParams) => {
  return http.request<ApiResult>("post", "/customers/walletRecharge", { data });
};

/** 积分调整 */
export const adjustPoints = (data: PointsAdjustParams) => {
  return http.request<ApiResult>("put", "/customers/pointsAdjust", { data });
};

/** 小程序端绑定手机号并合并账号 */
export const bindPhone = (data: { wechatOpenid: string; phone: string }) => {
  return http.request<ApiResult>("post", "/app/customer/bindPhone", { data });
};
