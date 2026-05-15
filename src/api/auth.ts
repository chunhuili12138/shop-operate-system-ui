import { http } from "@/utils/http";

type Result<T = any> = {
  success: boolean;
  code: number;
  msg: string;
  data: T;
  timestamp: number;
};

export const getUserInfo = () => {
  return http.request<Result>("get", "/auth/info");
};

export const logout = () => {
  return http.request<Result>("post", "/auth/logout");
};

export const getCaptcha = () => {
  return http.request<Result>("get", "/auth/captcha");
};
