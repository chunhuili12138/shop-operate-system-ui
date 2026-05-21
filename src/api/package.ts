import { http } from "@/utils/http";
import type { ApiResult } from "@/types/api";

// BOM 物料项
export interface BomItem {
  materialId: string;
  quantity: number;
}

// 套餐查询参数
export interface PackageQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  type?: string;
  status?: string;
}

// 套餐列表响应
export interface PackageListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      name: string;
      type: number;
      duration_minutes: number;
      price: string;
      max_people_per_session: number;
      is_active: number;
      description: string;
    }>;
    total: number;
  };
  timestamp: number;
}

// 套餐表单参数
export interface PackageFormParams {
  packageId?: number | null;
  name: string;
  type: number;
  durationMinutes: number | null;
  price: number;
  maxPeoplePerSession: number;
  description: string;
  bom: BomItem[];
}

// 套餐状态参数
export interface PackageStatusParams {
  packageId: number;
  isActive: number;
}

// BOM列表响应
export interface PackageBomResult {
  success: boolean;
  code: number;
  msg: string;
  data: Array<{
    material_name: string;
    quantity: number;
    unit: string;
  }>;
  timestamp: number;
}

/** 获取套餐列表 */
export const getPackageList = (params?: PackageQueryParams) => {
  return http.request<PackageListResult>("get", "/packages/page", { params });
};

/** 新增套餐 */
export const addPackage = (data: PackageFormParams) => {
  return http.request<ApiResult>("post", "/packages/add", { data });
};

/** 更新套餐 */
export const updatePackage = (data: PackageFormParams) => {
  return http.request<ApiResult>("put", "/packages/update", { data });
};

/** 切换套餐状态 */
export const updatePackageStatus = (data: PackageStatusParams) => {
  return http.request<ApiResult>("put", "/packages/status", { data });
};

/** 获取套餐BOM */
export const getPackageBom = (packagesId: number) => {
  return http.request<PackageBomResult>("get", "/packages/bom", {
    params: { packagesId }
  });
};

/** 删除套餐 */
export const deletePackage = (packageId: number) => {
  return http.request<ApiResult>("delete", "/packages/delete", {
    params: { packageId }
  });
};
