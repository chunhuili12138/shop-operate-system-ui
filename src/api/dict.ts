import { http } from "@/utils/http";

type Result<T = any> = {
  code: number;
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
};

export const getDictPage = (params?: any) => {
  return http.request<Result>("get", "/system/dict/page", { params });
};

export const getDictData = (dictCode?: string, shopId?: number | string) => {
  return http.request<Result>("get", `/system/dict/data/${dictCode}`, {
    params: { shopId }
  });
};

export const createDictItem = (data?: any) => {
  return http.request<Result>("post", "/system/dict/add", { data });
};

export const updateDictItem = (id: number | string, data?: any) => {
  return http.request<Result>("put", "/system/dict/update", { data: { ...data, id } });
};

export const deleteDictItem = (id: number | string) => {
  return http.request<Result>("delete", `/system/dict/delete/${id}`);
};
