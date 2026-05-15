import { http } from "@/utils/http";
import type { ApiResult } from "@/types/api";

export type MenuItem = {
  name?: string;
  path?: string;
  redirect?: string;
  component?: any;
  meta?: {
    title?: string;
    icon?: string;
    showLink?: boolean;
    rank?: number;
    roles?: string[];
    auths?: string[];
    frameSrc?: string;
    fixedTag?: boolean;
    [key: string]: any;
  };
  children?: MenuItem[];
};

export type AsyncRoutesResult = {
  menus: MenuItem[];
};

export const getAsyncRoutes = () => {
  return http.request<ApiResult<AsyncRoutesResult>>("get", "/auth/info");
};
