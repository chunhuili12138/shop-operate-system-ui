<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { formatDate } from "@/utils/date";
import {
  getGameSessions,
  getAvailableSessions,
  checkin,
  finishGameSession
} from "@/api/trade";
import { getCustomerList } from "@/api/customer";
import type { GameSession, AvailableSession } from "@/api/trade";

defineOptions({ name: "TradeCheckin" });

const activeList = ref<GameSession[]>([]);
const availSessions = ref<AvailableSession[]>([]);
const customerId = ref<number | null>(null);
const customers = ref<any[]>([]);
const activeLoading = ref(false);
const availLoading = ref(false);
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

const loadActive = async () => {
  activeLoading.value = true;
  try {
    const r = await getGameSessions({ status: "1", page: 1, size: 200 });
    if (r?.success) activeList.value = r.data?.list || [];
  } finally {
    activeLoading.value = false;
  }
};

const searchCustomers = async (keyword: string) => {
  if (!keyword) return;
  try {
    const r = await getCustomerList({ page: 1, size: 50, keyword });
    if (r?.success) customers.value = r.data?.list || [];
  } catch {
    /* ignore */
  }
};

const onCustomerSelect = (cid: number | null) => {
  customerId.value = cid;
  if (cid) {
    searchAvail();
  } else {
    availSessions.value = [];
  }
};

const searchAvail = async () => {
  if (!customerId.value) {
    availSessions.value = [];
    return;
  }
  availLoading.value = true;
  try {
    const r = await getAvailableSessions(customerId.value);
    if (r?.success) availSessions.value = r.data || [];
    else availSessions.value = [];
  } finally {
    availLoading.value = false;
  }
};

const onCheckin = async (csid: number) => {
  if (!customerId.value) {
    message("请先选择顾客", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm("确认核销入座？", "核销确认", {
      confirmButtonText: "确认核销",
      cancelButtonText: "取消",
      type: "warning"
    });
  } catch {
    return;
  }
  const r = await checkin({
    customersId: customerId.value,
    customerSessionId: csid
  });
  if (r?.success) {
    message("核销成功", { type: "success" });
    await searchAvail();
    await loadActive();
    if (activeList.value.length >= 50) {
      message("当前进行中人数较多，请注意店铺容量", {
        type: "warning",
        duration: 0,
        showClose: true
      });
    }
  } else {
    message(r?.msg || "核销失败", { type: "warning" });
  }
};

const onFinish = async (gsid: number) => {
  try {
    await ElMessageBox.confirm("确认结束该顾客的游玩？", "结束确认", {
      confirmButtonText: "确认结束",
      cancelButtonText: "取消",
      type: "warning"
    });
  } catch {
    return;
  }
  const r = await finishGameSession(gsid);
  if (r?.success) {
    message("已结束游玩", { type: "success" });
    await loadActive();
  } else {
    message(r?.msg || "结束失败", { type: "warning" });
  }
};

const elapsed = (row: any) => {
  if (!row.start_time) return "-";
  const diff = Math.floor(
    (now.value - new Date(row.start_time).getTime()) / 60000
  );
  if (diff < 0) return "0分";
  if (diff < 60) return diff + "分";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h + "时" + m + "分";
};

onMounted(() => {
  loadActive();
  timer = setInterval(() => {
    now.value = Date.now();
  }, 30000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card shadow="never">
          <template #header><span>核销入座</span></template>
          <div style="display: flex; gap: 8px; margin-bottom: 12px">
            <el-select
              v-model="customerId"
              filterable
              remote
              reserve-keyword
              :remote-method="searchCustomers"
              placeholder="搜索顾客姓名/手机号"
              style="flex: 1"
              @change="onCustomerSelect"
            >
              <el-option
                v-for="c in customers"
                :key="c.id"
                :label="c.nickname + ' (' + c.phone + ')'"
                :value="c.id"
              />
            </el-select>
          </div>
          <el-table v-loading="availLoading" :data="availSessions" stripe>
            <el-table-column prop="package_name" label="套餐" />
            <el-table-column label="可用日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.session_date) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="onCheckin(row.id)"
                  >核销</el-button
                >
              </template>
            </el-table-column>
            <template #empty
              ><el-empty description="请搜索顾客后查看" :image-size="60"
            /></template>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card shadow="never">
          <template #header
            ><span>进行中 ({{ activeList.length }})</span></template
          >
          <el-table v-loading="activeLoading" :data="activeList" stripe>
            <el-table-column prop="customer_name" label="顾客" width="150" />
            <el-table-column prop="package_name" label="套餐" />
            <el-table-column prop="start_time" label="开始时间" width="170" />
            <el-table-column label="时长" width="150">
              <template #default="{ row }">
                <div style="display: flex; flex-direction: column; gap: 4px">
                  <span
                    v-if="row.duration_minutes"
                    style="font-size: 14px; color: #606266"
                    >套餐: {{ row.duration_minutes }}分钟</span
                  >
                  <span v-else style="font-size: 14px; color: #909399"
                    >套餐: 不限时</span
                  >
                  <span
                    style="color: #e6a23c; font-weight: 700; font-size: 16px"
                    >已玩: {{ elapsed(row) }}</span
                  >
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="staff_name" label="核销人员" width="80" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="warning" size="small" @click="onFinish(row.id)"
                  >结束</el-button
                >
              </template>
            </el-table-column>
            <template #empty
              ><el-empty description="暂无进行中" :image-size="60"
            /></template>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
