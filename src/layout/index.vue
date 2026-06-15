<script setup lang="ts">
import "animate.css";
// 引入 src/components/ReIcon/src/offlineIcon.ts 文件中所有使用addIcon添加过的本地图标
import "@/components/ReIcon/src/offlineIcon";
import { setType } from "./types";
import { useLayout } from "./hooks/useLayout";
import { useAppStoreHook } from "@/store/modules/app";
import { useSettingStoreHook } from "@/store/modules/settings";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useUserStoreHook } from "@/store/modules/user";
import { getToken, getCurrentShopId } from "@/utils/auth";
import {
  h,
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeMount,
  onUnmounted,
  defineComponent
} from "vue";
import {
  useDark,
  useGlobal,
  deviceDetection,
  useResizeObserver
} from "@pureadmin/utils";

import LayTag from "./components/lay-tag/index.vue";
import LayNavbar from "./components/lay-navbar/index.vue";
import LayContent from "./components/lay-content/index.vue";
import LaySetting from "./components/lay-setting/index.vue";
import NavVertical from "./components/lay-sidebar/NavVertical.vue";
import NavHorizontal from "./components/lay-sidebar/NavHorizontal.vue";
import BackTopIcon from "@/assets/svg/back_top.svg?component";

const appWrapperRef = ref();
const { isDark } = useDark();
const { layout } = useLayout();
const isMobile = deviceDetection();
const pureSetting = useSettingStoreHook();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const set: setType = reactive({
  sidebar: computed(() => {
    return useAppStoreHook().sidebar;
  }),

  device: computed(() => {
    return useAppStoreHook().device;
  }),

  fixedHeader: computed(() => {
    return pureSetting.fixedHeader;
  }),

  classes: computed(() => {
    return {
      hideSidebar: !set.sidebar.opened,
      openSidebar: set.sidebar.opened,
      withoutAnimation: set.sidebar.withoutAnimation,
      mobile: set.device === "mobile"
    };
  }),

  hideTabs: computed(() => {
    return $storage?.configure.hideTabs;
  })
});

function setTheme(layoutModel: string) {
  window.document.body.setAttribute("layout", layoutModel);
  $storage.layout = {
    layout: `${layoutModel}`,
    theme: $storage.layout?.theme,
    darkMode: $storage.layout?.darkMode,
    sidebarStatus: $storage.layout?.sidebarStatus,
    epThemeColor: $storage.layout?.epThemeColor,
    themeColor: $storage.layout?.themeColor,
    overallStyle: $storage.layout?.overallStyle
  };
}

function toggle(device: string, bool: boolean) {
  useAppStoreHook().toggleDevice(device);
  useAppStoreHook().toggleSideBar(bool, "resize");
}

// 判断是否可自动关闭菜单栏
let isAutoCloseSidebar = true;

useResizeObserver(appWrapperRef, entries => {
  if (isMobile) return;
  const entry = entries[0];
  const [{ inlineSize: width, blockSize: height }] = entry.borderBoxSize;
  useAppStoreHook().setViewportSize({ width, height });
  width <= 760 ? setTheme("vertical") : setTheme(useAppStoreHook().layout);
  /** width app-wrapper类容器宽度
   * 0 < width <= 760 隐藏侧边栏
   * 760 < width <= 990 折叠侧边栏
   * width > 990 展开侧边栏
   */
  if (width > 0 && width <= 760) {
    toggle("mobile", false);
    isAutoCloseSidebar = true;
  } else if (width > 760 && width <= 990) {
    if (isAutoCloseSidebar) {
      toggle("desktop", false);
      isAutoCloseSidebar = false;
    }
  } else if (width > 990 && !set.sidebar.isClickCollapse) {
    toggle("desktop", true);
    isAutoCloseSidebar = true;
  } else {
    toggle("desktop", false);
    isAutoCloseSidebar = false;
  }
});

const userStore = useUserStoreHook();

onMounted(() => {
  if (isMobile) {
    toggle("mobile", false);
  }

  // 初始化店铺助手
  initShopCopilot();
});

onUnmounted(() => {
  // 销毁店铺助手
  if (window.ShopCopilot) {
    window.ShopCopilot.destroy();
  }
});

// 初始化店铺助手
function initShopCopilot() {
  console.log("[ShopCopilot] 开始初始化...");

  // 等待 ShopCopilot 加载完成
  const checkShopCopilot = () => {
    console.log("[ShopCopilot] 检查 ShopCopilot...", typeof window.ShopCopilot);

    if (window.ShopCopilot) {
      console.log(
        "[ShopCopilot] ShopCopilot 已加载:",
        Object.keys(window.ShopCopilot)
      );

      if (typeof window.ShopCopilot.init === "function") {
        const tokenData = getToken();
        const shopId = getCurrentShopId();

        // 获取店铺名称
        const shopName =
          userStore.shops?.find((s: any) => s.id === shopId)?.name || "";

        console.log("[ShopCopilot] 初始化参数:", {
          shopId: shopId || 0,
          role: userStore.roles?.[0] || "guest",
          shopName: shopName
        });

        window.ShopCopilot.init({
          apiUrl: import.meta.env.VITE_CHAT_URL || "http://localhost:3000",
          token: tokenData?.accessToken || "",
          shopId: shopId || 0,
          role: userStore.roles?.[0] || "guest",
          userName: userStore.nickname || userStore.username || "",
          shopName: shopName
        });
      } else {
        console.error(
          "[ShopCopilot] init 不是函数:",
          typeof window.ShopCopilot.init
        );
      }
    } else {
      // 200ms 后重试，最多重试 50 次（10秒）
      if (checkCount < 50) {
        checkCount++;
        setTimeout(checkShopCopilot, 200);
      } else {
        console.error("[ShopCopilot] 加载超时");
      }
    }
  };

  let checkCount = 0;
  checkShopCopilot();
}

// 监听店铺切换
watch(
  () => userStore.currentShopId,
  (newVal, oldVal) => {
    if (newVal !== oldVal && window.ShopCopilot) {
      window.ShopCopilot.update({
        shopId: newVal || 0
      });
    }
  }
);

onBeforeMount(() => {
  useDataThemeChange().dataThemeChange($storage.layout?.overallStyle);
});

const LayHeader = defineComponent({
  name: "LayHeader",
  render() {
    return h(
      "div",
      {
        class: { "fixed-header": set.fixedHeader },
        style: [
          set.hideTabs && layout.value.includes("horizontal")
            ? isDark.value
              ? "box-shadow: 0 1px 4px #0d0d0d"
              : "box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08)"
            : ""
        ]
      },
      {
        default: () => [
          !pureSetting.hiddenSideBar &&
          (layout.value.includes("vertical") || layout.value.includes("mix"))
            ? h(LayNavbar)
            : null,
          !pureSetting.hiddenSideBar && layout.value.includes("horizontal")
            ? h(NavHorizontal)
            : null,
          h(LayTag)
        ]
      }
    );
  }
});
</script>

<template>
  <div ref="appWrapperRef" :class="['app-wrapper', set.classes]">
    <div
      v-show="
        set.device === 'mobile' &&
        set.sidebar.opened &&
        layout.includes('vertical')
      "
      class="app-mask"
      @click="useAppStoreHook().toggleSideBar()"
    />
    <NavVertical
      v-show="
        !pureSetting.hiddenSideBar &&
        (layout.includes('vertical') || layout.includes('mix'))
      "
    />
    <div
      :class="[
        'main-container',
        pureSetting.hiddenSideBar ? 'main-hidden' : ''
      ]"
    >
      <div v-if="set.fixedHeader">
        <LayHeader />
        <!-- 主体内容 -->
        <LayContent :fixed-header="set.fixedHeader" />
      </div>
      <el-scrollbar v-else>
        <el-backtop
          title="回到顶部"
          target=".main-container .el-scrollbar__wrap"
        >
          <BackTopIcon />
        </el-backtop>
        <LayHeader />
        <!-- 主体内容 -->
        <LayContent :fixed-header="set.fixedHeader" />
      </el-scrollbar>
    </div>
    <!-- 系统设置 -->
    <LaySetting />
  </div>
</template>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  width: 100%;
  height: 100%;

  &::after {
    clear: both;
    display: table;
    content: "";
  }

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.app-mask {
  position: absolute;
  top: 0;
  z-index: 2001;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: 0.3;
}

.re-screen {
  margin-top: 12px;
}
</style>
