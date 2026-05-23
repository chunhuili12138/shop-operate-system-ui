<script setup lang="ts">
import { ref, computed } from "vue";
import { noticesData, setNotifications, removeNotification, TabItem } from "./data";
import NoticeList from "./components/NoticeList.vue";
import BellIcon from "~icons/ep/bell";
import { getNotificationList, getUnreadCount, markNotificationsRead } from "@/api/finance";
import { message } from "@/utils/message";
import { useRouter } from "vue-router";

const router = useRouter();
const noticesNum = ref(0);
const notices = ref<TabItem[]>(noticesData);
const activeKey = ref("1");

const fetchUnreadCount = async () => {
  try {
    const r = await getUnreadCount();
    if (r?.success) noticesNum.value = Number(r.data) || 0;
  } catch { /* ignore */ }
};

const fetchNotifications = async () => {
  try {
    const r = await getNotificationList({ page: 1, size: 10 });
    if (r?.success && r.data?.list) {
      const items = r.data.list
        .filter((v: any) => v.status === 1)
        .slice(0, 10)
        .map((v: any) => ({
          id: String(v.id),
          title: v.title,
          description: v.content?.length > 50 ? v.content.substring(0, 50) + "..." : (v.content || ""),
          datetime: v.created_at?.substring(0, 10) || "",
          type: "1",
          unread: true,
          channel: v.channel
        }));
      setNotifications(items);
    }
  } catch { /* ignore */ }
};

const markAsRead = async (id: string) => {
  const r = await markNotificationsRead({ notificationIds: id });
  if (r?.success) {
    removeNotification(id);
    noticesNum.value = Math.max(0, noticesNum.value - 1);
  } else message(r?.msg || "操作失败", { type: "warning" });
};

const goAll = () => {
  router.push("/finance/notification");
};

const getLabel = computed(
  () => (item: TabItem) =>
    item.name + (item.list.length > 0 ? `(${item.list.length})` : "")
);

const onDropdownVisible = (v: boolean) => {
  if (v) {
    fetchUnreadCount();
    fetchNotifications();
  }
};

fetchUnreadCount();
</script>

<template>
  <el-dropdown trigger="click" placement="bottom-end" @visible-change="onDropdownVisible">
    <span :class="['dropdown-badge','navbar-bg-hover','select-none', Number(noticesNum) !== 0 && 'mr-[10px]']">
      <el-badge :value="Number(noticesNum) === 0 ? '' : noticesNum" :max="99">
        <span class="header-notice-icon">
          <IconifyIconOffline :icon="BellIcon" />
        </span>
      </el-badge>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-tabs v-model="activeKey" :stretch="true" class="dropdown-tabs" :style="{ width: '330px' }">
          <template v-for="item in notices" :key="item.key">
            <el-tab-pane :label="getLabel(item)" :name="item.key">
              <el-scrollbar max-height="330px">
                <div class="noticeList-container">
                  <NoticeList :list="item.list" :emptyText="item.emptyText" :on-read="markAsRead" />
                </div>
              </el-scrollbar>
            </el-tab-pane>
          </template>
          <div class="dropdown-footer" @click="goAll">
            <span>查看全部</span>
          </div>
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
  .header-notice-icon { font-size: 18px; }
}

.dropdown-tabs {
  .noticeList-container { padding: 0 24px; }
  :deep(.el-tabs__header) { margin: 0; }
  :deep(.el-tabs__nav-wrap)::after { height: 1px; }
  :deep(.el-tabs__nav-wrap) { padding: 0 36px; }
}

.dropdown-footer {
  text-align: center;
  padding: 10px 0;
  border-top: 1px solid #f0f0f0;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 13px;
  &:hover { background: #f5f7fa; }
}
</style>
