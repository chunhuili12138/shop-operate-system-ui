import { http } from "@/utils/http";

type Result<T = any> = {
  code: number;
  message: string;
  data: T;
  timestamp: number;
};

export const uploadImage = (data: FormData) => {
  return http.request<Result>("post", "/upload/image", {
    data,
    headers: { "Content-Type": "multipart/form-data" }
  });
};
