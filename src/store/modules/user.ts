import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import { getLogin, refreshTokenApi, getUserInfo } from "@/api/user";
import type { RefreshTokenResult } from "@/types/api";
import { useMultiTagsStoreHook } from "./multiTags";
import {
  type DataInfo,
  setToken,
  removeToken,
  userKey,
  getCurrentShopId,
  setCurrentShopId
} from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): any => ({
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "",
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    permissions:
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    isRemembered: false,
    loginDay: 7,
    superAdmin:
      storageLocal().getItem<DataInfo<number>>(userKey)?.superAdmin ?? false,
    userId: null as number | null,
    shops: [],
    /** 当前选中的店铺ID（超管为null） */
    currentShopId: getCurrentShopId()
  }),
  actions: {
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    SET_USERNAME(username: string) {
      this.username = username;
    },
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    SET_SHOPS(shops: Array<any>) {
      this.shops = shops;
    },
    SET_CURRENT_SHOP_ID(id: number | null) {
      this.currentShopId = id;
      setCurrentShopId(id);
    },
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 切换店铺（不退出登录，只换 shopId） */
    async switchShop(shopId: number) {
      this.SET_CURRENT_SHOP_ID(shopId);
      // 刷新当前页面（所有接口会携带新 shopId）
      window.location.reload();
    },
    /** 登入 */
    async loginByUsername(data) {
      return new Promise<any>((resolve, reject) => {
        getLogin(data)
          .then(res => {
            if (res?.success === true) {
              const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
              setToken({
                accessToken: res.data.token,
                refreshToken: res.data.refreshToken,
                expires
              });
              this.superAdmin = res.data.superAdmin ?? false;
              const u =
                storageLocal().getItem<DataInfo<number>>(userKey) ||
                ({} as any);
              u.superAdmin = this.superAdmin;
              storageLocal().setItem(userKey, u);
            }
            resolve(res);
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];
      this.shops = [];
      this.currentShopId = null;
      removeToken();
      setCurrentShopId(null);
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      // 延迟跳转，让用户看到提示信息
      setTimeout(() => {
        router.push("/login");
      }, 500);
    },
    /** 获取用户信息并更新store */
    async getUserInfoAction() {
      return new Promise<any>((resolve, reject) => {
        getUserInfo()
          .then(res => {
            if (res?.success === true) {
              const info = res.data;
              this.SET_USERNAME(info.username);
              this.SET_NICKNAME(info.nickname);
              this.SET_AVATAR(info.avatar || "");
              this.SET_ROLES(info.roles || []);
              this.SET_PERMS(info.buttons || []);
              this.SET_SHOPS(info.shops || []);
              this.userId = info.userId;
              this.superAdmin = info.roles?.includes("超级管理员") ?? false;
              const saved =
                storageLocal().getItem<DataInfo<number>>(userKey) ||
                ({} as any);
              saved.superAdmin = this.superAdmin;
              saved.avatar = info.avatar || "";
              saved.username = info.username;
              saved.nickname = info.nickname;
              saved.roles = info.roles || [];
              saved.permissions = info.buttons || [];
              storageLocal().setItem(userKey, saved);
              resolve(res);
            } else {
              reject(new Error(res?.msg || "获取用户信息失败"));
            }
          })
          .catch(error => reject(error));
      });
    },

    /** 刷新`token` */
    async handRefreshToken(data) {
      return new Promise<RefreshTokenResult>((resolve, reject) => {
        refreshTokenApi(data)
          .then(res => {
            if (res?.success === true) {
              const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
              setToken({
                accessToken: res.data.accessToken,
                refreshToken: res.data.refreshToken,
                expires
              });
              resolve(res.data);
            } else {
              reject(new Error(res?.msg || "刷新token失败"));
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
