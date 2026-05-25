import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { message } from "@/utils/message";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求超时时间
  timeout: 10000,
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** `token`过期后，暂存待执行的请求 */
  private static requests = [];

  /** 防止重复刷新`token` */
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise((resolve, reject) => {
      PureHttp.requests.push((token: string) => {
        if (token) {
          const shopId = useUserStoreHook().currentShopId;
          config.headers["Authorization"] = formatToken(token, shopId);
          resolve(config);
        } else {
          reject(new Error("刷新token失败"));
        }
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        const whiteList = ["/auth/refresh-token", "/auth/login"];
        return whiteList.some(url => config.url.endsWith(url))
          ? config
          : new Promise(resolve => {
              const data = getToken();
              if (data) {
                const now = new Date().getTime();
                const expired = parseInt(data.expires) - now <= 0;
                if (expired) {
                  if (!PureHttp.isRefreshing) {
                    PureHttp.isRefreshing = true;
                    // token过期刷新
                    useUserStoreHook()
                      .handRefreshToken({ refreshToken: data.refreshToken })
                      .then(res => {
                        const token = res.data?.accessToken || res.data?.token;
                        if (token) {
                          const shopId = useUserStoreHook().currentShopId;
                          config.headers["Authorization"] = formatToken(
                            token,
                            shopId
                          );
                          PureHttp.requests.forEach(cb => cb(token));
                          PureHttp.requests = [];
                        } else {
                          PureHttp.requests.forEach(cb => cb(null));
                          PureHttp.requests = [];
                          message("登录已过期，请重新登录", {
                            type: "warning"
                          });
                        }
                      })
                      .catch(() => {
                        // 刷新失败，拒绝所有等待的请求
                        PureHttp.requests.forEach(cb => cb(null));
                        PureHttp.requests = [];
                        message("登录已过期，请重新登录", {
                          type: "warning"
                        });
                      })
                      .finally(() => {
                        PureHttp.isRefreshing = false;
                      });
                  }
                  resolve(PureHttp.retryOriginalRequest(config));
                } else {
                  const shopId = useUserStoreHook().currentShopId;
                  config.headers["Authorization"] = formatToken(
                    data.accessToken,
                    shopId
                  );
                  resolve(config);
                }
              } else {
                resolve(config);
              }
            });
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;

        // 检查响应体中的 code 字段是否为 401
        const responseData = response.data;
        if (responseData && responseData.code === 401) {
          const whiteList = ["/auth/refresh-token", "/auth/login"];
          if (whiteList.some(url => $config.url?.endsWith(url))) {
            useUserStoreHook().logOut();
            return Promise.reject(new Error(responseData.msg || "未登录"));
          }

          const data = getToken();
          if (!data) {
            message("未登录或登录已失效，请重新登录", {
              type: "warning"
            });
            useUserStoreHook().logOut();
            return Promise.reject(new Error(responseData.msg || "未登录"));
          }

          // 尝试刷新 token
          if (!PureHttp.isRefreshing) {
            PureHttp.isRefreshing = true;
            useUserStoreHook()
              .handRefreshToken({ refreshToken: data.refreshToken })
              .then(res => {
                const token = res?.accessToken || res?.token;
                if (token) {
                  message("登录状态已刷新", { type: "success" });
                  PureHttp.requests.forEach(cb => cb(token));
                  PureHttp.requests = [];
                } else {
                  PureHttp.requests.forEach(cb => cb(null));
                  PureHttp.requests = [];
                  message("登录已过期，请重新登录", {
                    type: "warning"
                  });
                  useUserStoreHook().logOut();
                }
              })
              .catch(() => {
                PureHttp.requests.forEach(cb => cb(null));
                PureHttp.requests = [];
                message("登录已过期，请重新登录", {
                  type: "warning"
                });
                useUserStoreHook().logOut();
              })
              .finally(() => {
                PureHttp.isRefreshing = false;
              });
          }

          // 将当前请求加入队列，等待 token 刷新后重试
          return new Promise((resolve, reject) => {
            PureHttp.requests.push((token: string) => {
              if (token) {
                const shopId = useUserStoreHook().currentShopId;
                $config.headers["Authorization"] = formatToken(token, shopId);
                PureHttp.axiosInstance
                  .request($config)
                  .then(resolve)
                  .catch(reject);
              } else {
                reject(new Error("刷新token失败"));
              }
            });
          });
        }

        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        return response.data;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        if ($error.isCancelRequest) return Promise.reject($error);

        const { response, config } = $error;

        // 401 未登录或token失效：尝试刷新token后重试，失败则清空信息跳转登录页
        if (response?.status === 401) {
          const whiteList = ["/auth/refresh-token", "/auth/login"];
          if (whiteList.some(url => config.url?.endsWith(url))) {
            useUserStoreHook().logOut();
            return Promise.reject($error);
          }

          const data = getToken();
          if (!data) {
            message("未登录或登录已失效，请重新登录", {
              type: "warning"
            });
            useUserStoreHook().logOut();
            return Promise.reject($error);
          }

          if (!PureHttp.isRefreshing) {
            PureHttp.isRefreshing = true;
            useUserStoreHook()
              .handRefreshToken({ refreshToken: data.refreshToken })
              .then(res => {
                const token = res?.accessToken || res?.token;
                if (token) {
                  message("登录状态已刷新", { type: "success" });
                  PureHttp.requests.forEach(cb => cb(token));
                  PureHttp.requests = [];
                } else {
                  PureHttp.requests.forEach(cb => cb(null));
                  PureHttp.requests = [];
                  message("登录已过期，请重新登录", {
                    type: "warning"
                  });
                  useUserStoreHook().logOut();
                }
              })
              .catch(() => {
                PureHttp.requests.forEach(cb => cb(null));
                PureHttp.requests = [];
                message("登录已过期，请重新登录", {
                  type: "warning"
                });
                useUserStoreHook().logOut();
              })
              .finally(() => {
                PureHttp.isRefreshing = false;
              });
          }

          return new Promise((resolve, reject) => {
            PureHttp.requests.push((token: string) => {
              if (token) {
                const shopId = useUserStoreHook().currentShopId;
                config.headers["Authorization"] = formatToken(token, shopId);
                PureHttp.axiosInstance
                  .request(config)
                  .then(resolve)
                  .catch(reject);
              } else {
                reject(new Error("刷新token失败"));
              }
            });
          });
        }

        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的`post`工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }

  /** 单独抽离的`put`工具函数 */
  public put<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("put", url, params, config);
  }

  /** 单独抽离的`delete`工具函数 */
  public delete<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("delete", url, params, config);
  }

  /** 单独抽离的`patch`工具函数 */
  public patch<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("patch", url, params, config);
  }
}

export const http = new PureHttp();
