<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import {
  getNotificationList,
  markNotificationsRead,
  sendNotification
} from "@/api/finance";
import { getStaffList } from "@/api/system";

defineOptions({ name: "FinanceNotification" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const unreadCount = ref(0);
const staffList = ref<any[]>([]);

// 发送通知
const sendDialog = ref(false);
const sendForm = reactive<{
  recipientIds: string | string[];
  title: string;
  content: string;
}>({ recipientIds: [], title: "", content: "" });

const load = async () => {
  loading.value = true;
  try {
    const r = await getNotificationList({ page: page.value, size: size.value });
    if (r?.success) {
      tableData.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const loadUnreadCount = async () => {
  try {
    const r = await getNotificationList({ page: 1, size: 100 });
    if (r?.success) {
      const list = r.data.list || [];
      unreadCount.value = list.filter((v: any) => v.status === 1).length;
    }
  } catch {
    /* ignore */
  }
};

const loadStaff = async () => {
  try {
    const r = await getStaffList({ page: 1, size: 200 });
    if (r?.success) staffList.value = r.data?.list || [];
  } catch {
    /* ignore */
  }
};

const markAsRead = async (id: string) => {
  const r = await markNotificationsRead({ notificationIds: String(id) });
  if (r?.success) {
    message("已标记为已读", { type: "success" });
    load();
    loadUnreadCount();
  } else message(r?.msg || "操作失败", { type: "warning" });
};

const markAllAsRead = async () => {
  const ids = tableData.value
    .filter((v: any) => v.status === 1)
    .map((v: any) => v.id)
    .join(",");
  if (!ids) {
    message("没有未读通知", { type: "warning" });
    return;
  }
  const r = await markNotificationsRead({ notificationIds: ids });
  if (r?.success) {
    message("全部已读", { type: "success" });
    load();
    loadUnreadCount();
  } else message(r?.msg || "操作失败", { type: "warning" });
};

const onSend = async () => {
  const ids = Array.isArray(sendForm.recipientIds)
    ? sendForm.recipientIds.join(",")
    : sendForm.recipientIds;
  if (!ids || !sendForm.title) {
    message("请填写接收人和标题", { type: "warning" });
    return;
  }
  const r = await sendNotification({
    recipientIds: ids,
    title: sendForm.title,
    content: sendForm.content
  });
  if (r?.success) {
    message("发送成功", { type: "success" });
    sendDialog.value = false;
    load();
  } else message(r?.msg || "发送失败", { type: "warning" });
};

const statusLabel = (s: number) =>
  ({ 1: "未读", 2: "已读", 3: "发送失败" })[s] || "未知";
const statusType = (s: number): any =>
  ({ 1: "warning", 2: "success", 3: "danger" })[s] || "info";

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

onMounted(() => {
  load();
  loadUnreadCount();
  loadStaff();
});
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-left">
        <span class="text-dim"
          >未读 <el-badge :value="unreadCount" :max="99" class="ml-1"
        /></span>
      </div>
      <div class="page-header-right">
        <el-button
          type="primary"
          size="small"
          @click="
            sendDialog = true;
            Object.assign(sendForm, {
              recipientIds: [],
              title: '',
              content: ''
            });
          "
          >发送通知</el-button
        >
        <el-button size="small" @click="markAllAsRead">全部标为已读</el-button>
      </div>
    </div>

    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column prop="title" label="标题" width="160" />
        <el-table-column label="内容" min-width="260">
          <template #default="{ row }">
            <el-tooltip
              :content="row.content"
              placement="top"
              :show-after="500"
            >
              <span class="text-ellipsis">{{ row.content }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{
              statusLabel(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="接收时间" width="170" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              type="primary"
              link
              size="small"
              @click="markAsRead(row.id)"
              >标为已读</el-button
            >
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无通知" /></template>
      </el-table>
    </div>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination"
      @size-change="onSizeChange"
      @current-change="load"
    />

    <el-dialog
      v-model="sendDialog"
      title="发送通知"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="sendForm" label-width="80px">
        <el-form-item label="接收员工" required>
          <el-select
            v-model="sendForm.recipientIds"
            multiple
            filterable
            placeholder="选择员工"
            style="width: 100%"
          >
            <el-option
              v-for="s in staffList"
              :key="s.id"
              :label="s.name"
              :value="String(s.id)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="sendForm.title" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="sendForm.content" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendDialog = false">取消</el-button>
        <el-button type="primary" @click="onSend">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>
