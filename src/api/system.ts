import { http } from "@/utils/http";
import { ApiResult } from "@/types/api";

// ========== 字典管理相关 ==========

// 字典查询参数
export interface DictQueryParams {
  page?: number;
  size?: number;
  dictCode?: string;
}

// 字典列表响应
export interface DictListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      dict_code: string;
      dict_key: number;
      dict_value: string;
      dict_label: string;
      sort: number;
      is_active: number;
      created_at: string;
    }>;
    total: number;
  };
  timestamp: number;
}

// 字典表单参数
export interface DictFormParams {
  id?: number | null;
  dictCode: string;
  dictKey: number | null;
  dictValue: string;
  dictLabel: string;
  sort: number;
}

/** 获取字典列表 */
export const getDictList = (params?: DictQueryParams) => {
  return http.request<DictListResult>("get", "/system/dict/page", { params });
};

/** 新增字典项 */
export const addDict = (data: DictFormParams) => {
  return http.request<ApiResult>("post", "/system/dict/add", { data });
};

/** 更新字典项 */
export const updateDict = (data: DictFormParams) => {
  return http.request<ApiResult>("put", "/system/dict/update", { data });
};

/** 删除字典项 */
export const deleteDict = (id: number) => {
  return http.request<ApiResult>("delete", `/system/dict/delete/${id}`);
};

// 字典数据查询参数
export interface DictDataQueryParams {
  dictCode: string;
}

// 字典数据列表响应
export interface DictDataListResult {
  success: boolean;
  code: number;
  msg: string;
  data: Array<{
    dict_key: number;
    dict_value: string;
    dict_label: string;
  }>;
  timestamp: number;
}

/** 获取字典数据 */
export const getDictData = (params?: DictDataQueryParams) => {
  return http.request<DictDataListResult>("get", "/system/dict/data", { params });
};

// ========== 角色管理相关 ==========

// 角色列表响应
export interface RoleListResult {
  success: boolean;
  code: number;
  msg: string;
  data: Array<{
    id: number;
    name: string;
    description: string;
    perm_count: number;
    permissionIds?: number[];
  }>;
  timestamp: number;
}

// 角色表单参数
export interface RoleFormParams {
  id?: number | null;
  name: string;
  description: string;
}

// 角色权限参数
export interface RolePermissionsParams {
  roleId: number;
  permissionIds: string;
}

/** 获取角色列表 */
export const getRoleList = () => {
  return http.request<RoleListResult>("get", "/roles/list");
};

/** 新增角色 */
export const addRole = (data: RoleFormParams) => {
  return http.request<ApiResult>("post", "/roles/add", { data });
};

/** 更新角色 */
export const updateRole = (data: RoleFormParams) => {
  return http.request<ApiResult>("put", "/roles/update", { data });
};

/** 设置角色权限 */
export const setRolePermissions = (data: RolePermissionsParams) => {
  return http.request<ApiResult>("put", "/roles/permissions", { data });
};

// ========== 员工管理相关 ==========

// 员工查询参数
export interface StaffQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  roleId?: number | string;
  status?: number | string;
}

// 员工列表响应
export interface StaffListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      name: string;
      username: string;
      phone: string;
      role_names: string;
      employment_type: number;
      status: number;
      shop_id: number;
      remark: string;
      created_at: string;
    }>;
    total: number;
  };
  timestamp: number;
}

// 员工表单参数
export interface StaffFormParams {
  staffId?: number | null;
  name: string;
  phone: string;
  username?: string;
  password?: string;
  roleIds: number[];
  shopId: number | string;
  employmentType: number;
  remark: string;
}

// 重置密码参数
export interface ResetPasswordParams {
  staffId: number;
  newPassword: string;
}

/** 获取员工列表 */
export const getStaffList = (params?: StaffQueryParams) => {
  return http.request<StaffListResult>("get", "/staff/page", { params });
};

/** 新增员工 */
export const addStaff = (data: StaffFormParams) => {
  return http.request<ApiResult>("post", "/staff/add", { data });
};

/** 更新员工 */
export const updateStaff = (data: StaffFormParams) => {
  return http.request<ApiResult>("put", "/staff/update", { data });
};

/** 重置员工密码 */
export const resetStaffPassword = (data: ResetPasswordParams) => {
  return http.request<ApiResult>("put", "/staff/password", { data });
};

/** 删除员工 */
export const deleteStaff = (staffId: number) => {
  return http.request<ApiResult>("delete", "/staff/delete", { 
    params: { staffId } 
  });
};

// ========== 权限管理相关 ==========

// 权限列表响应
export interface PermissionListResult {
  success: boolean;
  code: number;
  msg: string;
  data: Array<{
    id: number;
    name: string;
    type: number;
    menuCode: string;
    children?: any[];
  }>;
  timestamp: number;
}

/** 获取权限列表 */
export const getPermissionList = () => {
  return http.request<PermissionListResult>("get", "/permissions/list");
};
