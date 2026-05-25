<script setup lang="ts">
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import { ref, reactive, toRaw, onMounted } from "vue";
import { debounce, storageLocal } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { getCaptcha } from "@/api/auth";
import { bg, avatar, illustration } from "./utils/static";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { userKey, type DataInfo, getToken } from "@/utils/auth";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";
import Key from "~icons/ri/key-2-line";

defineOptions({
  name: "Login"
});

const router = useRouter();
const loading = ref(false);
const disabled = ref(false);
const captchaImg = ref("");
const ruleFormRef = ref<FormInstance>();

const { initStorage } = useLayout();
initStorage();

const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title } = useNav();

const ruleForm = reactive({
  username: "",
  password: "",
  captchaId: "",
  captchaValue: ""
});

const loadCaptcha = async () => {
  try {
    const res: any = await getCaptcha();
    if (res?.success === true) {
      ruleForm.captchaId = res.data.captchaId;
      captchaImg.value = res.data.captchaBase64;
    }
  } catch {
    // captcha 加载失败不影响登录流程
  }
};

const shopDialogVisible = ref(false);
const shopOptions = ref<Array<{ id: number; name: string }>>([]);
const selectedShopId = ref<number | null>(null);

const doEnterSystem = () => {
  disabled.value = true;
  router
    .push(getTopMenu(true).path)
    .then(() => {
      message("登录成功", { type: "success" });
    })
    .finally(() => (disabled.value = false));
};

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password,
          captchaId: ruleForm.captchaId,
          captchaValue: ruleForm.captchaValue
        })
        .then(res => {
          if (res?.success === true && res.data) {
            return useUserStoreHook()
              .getUserInfoAction()
              .then(() => {
                const store = useUserStoreHook();
                // 超管 → 直接进入（无店铺绑定）
                if (store.superAdmin) {
                  store.SET_CURRENT_SHOP_ID(null);
                  return initRouter().then(() => doEnterSystem());
                }
                const shops = store.shops;
                if (!shops || shops.length === 0) {
                  message("未创建店铺，请联系管理员", { type: "error" });
                  return;
                }
                if (shops.length === 1) {
                  // 只有1个店铺 → 自动选中
                  store.SET_CURRENT_SHOP_ID(shops[0].id);
                  return initRouter().then(() => doEnterSystem());
                }
                // 多个店铺 → 弹窗让用户选，选完再调用 initRouter
                shopOptions.value = shops;
                selectedShopId.value = shops[0].id;
                shopDialogVisible.value = true;
              });
          } else {
            message(res?.msg || "登录失败", { type: "warning" });
            loadCaptcha();
          }
        })
        .catch(err => {
          const errMsg = err?.message || err?.msg || "网络异常，请重试";
          message(errMsg, { type: "error" });
          loadCaptcha();
        })
        .finally(() => (loading.value = false));
    }
  });
};

const confirmShop = async () => {
  if (!selectedShopId.value) return;
  useUserStoreHook().SET_CURRENT_SHOP_ID(selectedShopId.value);
  shopDialogVisible.value = false;
  await initRouter();
  doEnterSystem();
};

const immediateDebounce: any = debounce(
  formRef => onLogin(formRef),
  1000,
  true
);

useEventListener(document, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  )
    immediateDebounce(ruleFormRef.value);
});

onMounted(() => {
  loadCaptcha();
  // 已登录但未选店铺 → 自动弹出店铺选择弹窗
  const tokenInfo = getToken();
  if (tokenInfo) {
    const saved = storageLocal().getItem<DataInfo<number>>(userKey);
    const shops = saved?.shops;
    const shopId = storageLocal().getItem("current-shop-id");
    if (!saved?.superAdmin && shops?.length > 0 && !shopId) {
      shopOptions.value = shops;
      selectedShopId.value = shops[0].id;
      shopDialogVisible.value = true;
    }
  }
});
</script>

<template>
  <div class="select-none">
    <img :src="bg" class="wave" />
    <div class="flex-c absolute right-5 top-3">
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
    </div>
    <div class="login-container">
      <div class="img">
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-hidden">{{ title }}</h2>
          </Motion>

          <el-form
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item
                :rules="[
                  {
                    required: true,
                    message: '请输入账号',
                    trigger: 'blur'
                  }
                ]"
                prop="username"
              >
                <el-input
                  v-model="ruleForm.username"
                  clearable
                  placeholder="账号"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="ruleForm.password"
                  clearable
                  show-password
                  placeholder="密码"
                  :prefix-icon="useRenderIcon(Lock)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="200">
              <el-form-item prop="captchaValue">
                <div class="captcha-wrapper">
                  <el-input
                    v-model="ruleForm.captchaValue"
                    clearable
                    placeholder="验证码"
                    :prefix-icon="useRenderIcon(Key)"
                    class="captcha-input"
                  />
                  <img
                    v-if="captchaImg"
                    :src="captchaImg"
                    class="captcha-image"
                    title="点击刷新验证码"
                    @click="loadCaptcha"
                  />
                </div>
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-button
                class="w-full mt-4!"
                size="default"
                type="primary"
                :loading="loading"
                :disabled="disabled"
                @click="onLogin(ruleFormRef)"
              >
                登录
              </el-button>
            </Motion>
          </el-form>
        </div>
      </div>
    </div>
  </div>

  <!-- 店铺选择弹窗 -->
  <el-dialog
    v-model="shopDialogVisible"
    title="选择店铺"
    :close-on-click-modal="false"
    :show-close="false"
    width="480px"
    top="20vh"
  >
    <p class="text-gray-400 text-sm mb-4">您有多个店铺，请选择一个进入系统：</p>
    <div class="shop-list">
      <div
        v-for="s in shopOptions"
        :key="s.id"
        :class="[
          'shop-card',
          { 'shop-card--selected': selectedShopId === s.id }
        ]"
        @click="selectedShopId = s.id"
      >
        <div class="shop-card-icon">
          <span class="text-xl">🏪</span>
        </div>
        <div class="shop-card-body">
          <div class="shop-card-name">{{ s.name }}</div>
          <div v-if="s.address || s.contact_phone" class="shop-card-info">
            <span v-if="s.address" class="shop-card-addr"
              >📍 {{ s.address }}</span
            >
            <span v-if="s.contact_phone" class="shop-card-phone"
              >📞 {{ s.contact_phone }}</span
            >
          </div>
        </div>
        <div class="shop-card-check">
          <span
            v-if="selectedShopId === s.id"
            class="text-lg text-[var(--el-color-primary)]"
            >✓</span
          >
        </div>
      </div>
    </div>
    <template #footer>
      <el-button
        type="primary"
        :disabled="!selectedShopId"
        @click="confirmShop"
      >
        进入系统
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
@import url("@/style/login.css");

.captcha-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  flex-shrink: 0;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
}

.shop-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
}

.shop-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.shop-card:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.shop-card--selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.shop-card-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
}

.shop-card-body {
  flex: 1;
  min-width: 0;
}

.shop-card-name {
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.shop-card-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.shop-card-info span {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-card-check {
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}
</style>
