<script setup lang="ts">
import { ref, computed } from "vue";
import { noticesData, setNotifications } from "./data";
import NoticeList from "./components/NoticeList.vue";
import BellIcon from "~icons/ep/bell";
import { http } from "@/utils/http";

const noticesNum = ref(0);
const notices = ref(noticesData);
const activeKey = ref(noticesData[0]?.key);

const fetchNotifications = async () => {
  try {
    const r: any = await http.get("/notifications", {
      params: { page: 1, size: 10 }
    });
    if (r?.success && r.data?.list) {
      const items = r.data.list.map((v: any) => ({
        title: v.title,
        description: v.content?.length > 60 ? v.content.substring(0, 60) + "..." : (v.content || ""),
        datetime: v.created_at?.substring(0, 10) || "",
        type: "1",
        status: v.status === 1 ? "warning" : "success"
      }));
      setNotifications(items);
      updateCount();
    }
  } catch { /* ignore */ }
};

const updateCount = () => {
  noticesNum.value = 0;
  notices.value.forEach(v => (noticesNum.value += v.list.length));
};

const getLabel = computed(
  () => item =>
    item.name + (item.list.length > 0 ? `(${item.list.length})` : "")
);

fetchNotifications();
</script>

<template>
  <el-dropdown trigger="click" placement="bottom-end" @visible-change="(v: boolean) => { if (v) fetchNotifications(); }">
    <span
      :class="[
        'dropdown-badge',
        'navbar-bg-hover',
        'select-none',
        Number(noticesNum) !== 0 && 'mr-[10px]'
      ]"
    >
      <el-badge :value="Number(noticesNum) === 0 ? '' : noticesNum" :max="99">
        <span class="header-notice-icon">
          <IconifyIconOffline :icon="BellIcon" />
        </span>
      </el-badge>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-tabs
          v-model="activeKey"
          :stretch="true"
          class="dropdown-tabs"
          :style="{ width: notices.length === 0 ? '200px' : '330px' }"
        >
          <el-empty
            v-if="notices.length === 0"
            description="暂无消息"
            :image-size="60"
          />
          <span v-else>
            <template v-for="item in notices" :key="item.key">
              <el-tab-pane :label="getLabel(item)" :name="`${item.key}`">
                <el-scrollbar max-height="330px">
                  <div class="noticeList-container">
                    <NoticeList :list="item.list" :emptyText="item.emptyText" />
                  </div>
                </el-scrollbar>
              </el-tab-pane>
            </template>
          </span>
        </el-tabs>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.dropdown-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 48px;
  cursor: pointer;

  .header-notice-icon {
    font-size: 18px;
  }
}

.dropdown-tabs {
  .noticeList-container {
    padding: 15px 24px 0;
  }

  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap)::after {
    height: 1px;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 0 36px;
  }
}
</style>
