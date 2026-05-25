import { http } from "@/utils/http";
import type { ApiResult } from "@/types/api";

type UserResult = {
  success: boolean;
  code: number;
  msg: string;
  data: {
    token: string;
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
    /** 是否超级管理员 */
    superAdmin?: boolean;
  };
  timestamp: number;
};

type RefreshTokenResult = {
  success: boolean;
  code: number;
  msg: string;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
  timestamp: number;
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/auth/login", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/auth/refresh-token", {
    data
  });
};

/** 获取用户信息（含菜单权限） */
export const getUserInfo = () => {
  return http.request<ApiResult>("get", "/auth/info");
};
