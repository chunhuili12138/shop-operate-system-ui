import { http } from "@/utils/http";
import { ApiResult } from "@/types/api";

// 店铺查询参数
export interface ShopQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: number | string;
  ownerStaffId?: number | string;
}

// 店铺列表响应
export interface ShopListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      name: string;
      owner_name: string;
      contact_phone: string;
      address: string;
      status: number;
      created_at: string;
    }>;
    total: number;
  };
  timestamp: number;
}

// 店铺信息
export interface ShopInfo {
  id: number;
  name: string;
  address: string;
  contact_phone: string;
  max_capacity: number;
  description: string;
}

// 店铺表单参数
export interface ShopFormParams {
  shopsId?: number | null;
  name: string;
  address: string;
  contactPhone: string;
  maxCapacity: number | null;
  description: string;
  seatId?: string;
}

// 店铺状态参数
export interface ShopStatusParams {
  shopsId: number;
  status: number;
}

/** 获取店铺列表 */
export const getShopList = (params?: ShopQueryParams) => {
  return http.request<ShopListResult>("get", "/shops/page", { params });
};

/** 获取店铺详情 */
export const getShopInfo = (shopsId: number) => {
  return http.request<ApiResult>("get", "/shops/info", { 
    params: { shopsId } 
  });
};

/** 新增店铺 */
export const addShop = (data: ShopFormParams) => {
  return http.request<ApiResult>("post", "/shops/add", { data });
};

/** 更新店铺 */
export const updateShop = (data: ShopFormParams) => {
  return http.request<ApiResult>("put", "/shops/update", { data });
};

/** 切换店铺状态 */
export const updateShopStatus = (data: ShopStatusParams) => {
  return http.request<ApiResult>("put", "/shops/status", { data });
};

/** 删除店铺 */
export const deleteShop = (shopsId: number) => {
  return http.request<ApiResult>("delete", "/shops/delete", { 
    params: { shopsId } 
  });
};

// ========== 店长专属：当前店铺操作 ==========

/** 获取当前登录店铺信息 */
export const getMyShopInfo = () => {
  return http.request<ApiResult>("get", "/shops/my");
};

/** 编辑当前登录店铺 */
export const updateMyShop = (data: {
  name?: string;
  address?: string;
  contactPhone?: string;
  maxCapacity?: number;
  description?: string;
  signPhoto?: string;
}) => {
  return http.request<ApiResult>("put", "/shops/myUpdate", { data });
};

/** 切换当前登录店铺营业状态 */
export const updateMyShopStatus = (status: number) => {
  return http.request<ApiResult>("put", "/shops/myStatus", { data: { status } });
};

/** 上传招牌照片 */
export const uploadShopPhoto = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<ApiResult>("post", "/file/uploadShopPhoto", { data: formData });
};
