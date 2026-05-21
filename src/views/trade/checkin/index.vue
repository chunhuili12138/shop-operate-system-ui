<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { getGameSessions, getAvailableSessions, checkin, finishGameSession } from "@/api/trade";
import { getCustomerList } from "@/api/customer";
import type { GameSession, AvailableSession } from "@/api/trade";

defineOptions({ name: "TradeCheckin" });

const activeList = ref<GameSession[]>([]);
const availSessions = ref<AvailableSession[]>([]);
const customerId = ref<number>(0);
const customers = ref<any[]>([]);
const activeLoading = ref(false);
const availLoading = ref(false);

const loadActive = async () => {
  activeLoading.value = true;
  try {
    const r = await getGameSessions({ status: "1", page: 1, size: 200 });
    if (r?.success) activeList.value = r.data?.list || [];
  } finally { activeLoading.value = false; }
};

const searchCustomers = async (keyword: string) => {
  if (!keyword) return;
  try {
    const r = await getCustomerList({ page: 1, size: 50, keyword });
    if (r?.success) customers.value = r.data?.list || [];
  } catch { /* ignore */ }
};

const onCustomerSelect = (cid: number) => {
  customerId.value = cid;
  searchAvail();
};

const searchAvail = async () => {
  if (!customerId.value) return;
  availLoading.value = true;
  try {
    const r = await getAvailableSessions(customerId.value);
    if (r?.success) availSessions.value = r.data || [];
    else availSessions.value = [];
  } finally { availLoading.value = false; }
};

const onCheckin = async (csid: number) => {
  try {
    await ElMessageBox.confirm("确认核销入座？", "核销确认", { confirmButtonText: "确认核销", cancelButtonText: "取消", type: "warning" });
  } catch { return; }
  const r = await checkin({ customersId: customerId.value, customerSessionId: csid });
  if (r?.success) {
    message("核销成功", { type: "success" });
    searchAvail();
    loadActive();
    if (activeList.value.length >= 50) {
      message("当前进行中人数较多，请注意店铺容量", { type: "warning", duration: 0, showClose: true });
    }
  } else {
    message(r?.msg || "核销失败", { type: "warning" });
  }
};

const onFinish = async (gsid: number) => {
  try {
    await ElMessageBox.confirm("确认结束该顾客的游玩？", "结束确认", { confirmButtonText: "确认结束", cancelButtonText: "取消", type: "warning" });
  } catch { return; }
  const r = await finishGameSession(gsid);
  if (r?.success) {
    message("已结束游玩", { type: "success" });
    loadActive();
  } else {
    message(r?.msg || "结束失败", { type: "warning" });
  }
};

onMounted(loadActive);
</script>

<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card shadow="never">
          <template #header><span>核销入座</span></template>
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <el-select
              v-model="customerId"
              filterable
              remote
              reserve-keyword
              :remote-method="searchCustomers"
              placeholder="搜索顾客姓名/手机号"
              style="flex:1"
              @change="onCustomerSelect"
            >
              <el-option v-for="c in customers" :key="c.id" :label="c.nickname + ' (' + c.phone + ')'" :value="c.id" />
            </el-select>
          </div>
          <el-table v-loading="availLoading" :data="availSessions" stripe>
            <el-table-column prop="package_name" label="套餐" />
            <el-table-column prop="session_date" label="可用日期" width="120" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="onCheckin(row.id)">核销</el-button>
              </template>
            </el-table-column>
            <template #empty><el-empty description="请搜索顾客后查看" :image-size="60" /></template>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card shadow="never">
          <template #header><span>进行中 ({{ activeList.length }})</span></template>
          <el-table v-loading="activeLoading" :data="activeList" stripe>
            <el-table-column prop="customer_name" label="顾客" />
            <el-table-column prop="staff_name" label="员工" width="80" />
            <el-table-column prop="start_time" label="开始时间" width="170" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="warning" size="small" @click="onFinish(row.id)">结束</el-button>
              </template>
            </el-table-column>
            <template #empty><el-empty description="暂无进行中" :image-size="60" /></template>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
