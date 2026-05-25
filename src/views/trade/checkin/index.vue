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

// ---- 历史记录 ----
const rightTab = ref<"active" | "history">("active");
const historyList = ref<GameSession[]>([]);
const historyLoading = ref(false);
const historyPage = ref(1);
const historySize = ref(20);
const historyTotal = ref(0);
const historyFilter = ref({ keyword: "", startDate: "", endDate: "" });

const loadActive = async () => {
  activeLoading.value = true;
  try {
    const r = await getGameSessions({ status: "1", page: 1, size: 200 });
    if (r?.success) activeList.value = r.data?.list || [];
  } finally {
    activeLoading.value = false;
  }
};

const loadHistory = async () => {
  historyLoading.value = true;
  try {
    const r = await getGameSessions({
      status: "2",
      page: historyPage.value,
      size: historySize.value,
      keyword: historyFilter.value.keyword || undefined,
      startDate: historyFilter.value.startDate || undefined,
      endDate: historyFilter.value.endDate || undefined
    });
    if (r?.success) {
      historyList.value = r.data?.list || [];
      historyTotal.value = r.data?.total || 0;
    } else {
      historyList.value = [];
      historyTotal.value = 0;
    }
  } finally {
    historyLoading.value = false;
  }
};

const searchHistory = () => {
  historyPage.value = 1;
  loadHistory();
};

const resetHistory = () => {
  historyFilter.value = { keyword: "", startDate: "", endDate: "" };
  historyPage.value = 1;
  loadHistory();
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
    // 如果正在查看历史，也刷新一下
    if (rightTab.value === "history") loadHistory();
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

const formatDuration = (row: any) => {
  if (!row.start_time || !row.end_time) return "-";
  const diff = Math.floor(
    (new Date(row.end_time).getTime() - new Date(row.start_time).getTime()) /
      60000
  );
  if (diff < 0) return "-";
  if (diff < 60) return diff + "分";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h + "时" + m + "分";
};

const onTabChange = (tab: "active" | "history") => {
  rightTab.value = tab;
  if (tab === "history" && historyList.value.length === 0) {
    loadHistory();
  }
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
          <template #header>
            <div style="display: flex; gap: 16px; align-items: center">
              <span
                :class="['tab-link', { 'tab-active': rightTab === 'active' }]"
                style="cursor: pointer"
                @click="onTabChange('active')"
              >
                进行中 ({{ activeList.length }})
              </span>
              <span
                :class="['tab-link', { 'tab-active': rightTab === 'history' }]"
                style="cursor: pointer"
                @click="onTabChange('history')"
              >
                历史记录
              </span>
            </div>
          </template>

          <!-- 进行中 -->
          <template v-if="rightTab === 'active'">
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
                      style=" font-size: 16px; font-weight: 700;color: #e6a23c"
                      >已玩: {{ elapsed(row) }}</span
                    >
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="staff_name" label="核销人员" width="80" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button
                    type="warning"
                    size="small"
                    @click="onFinish(row.id)"
                    >结束</el-button
                  >
                </template>
              </el-table-column>
              <template #empty
                ><el-empty description="暂无进行中" :image-size="60"
              /></template>
            </el-table>
          </template>

          <!-- 历史记录 -->
          <template v-if="rightTab === 'history'">
            <el-form :model="historyFilter" inline style="margin-bottom: 12px">
              <el-form-item label="顾客">
                <el-input
                  v-model="historyFilter.keyword"
                  clearable
                  placeholder="姓名/手机号"
                  style="width: 140px"
                  @keyup.enter="searchHistory"
                />
              </el-form-item>
              <el-form-item label="开始日期">
                <el-date-picker
                  v-model="historyFilter.startDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="开始日期"
                  style="width: 140px"
                />
              </el-form-item>
              <el-form-item label="结束日期">
                <el-date-picker
                  v-model="historyFilter.endDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="结束日期"
                  style="width: 140px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="searchHistory"
                  >查询</el-button
                >
                <el-button @click="resetHistory">重置</el-button>
              </el-form-item>
            </el-form>
            <el-table v-loading="historyLoading" :data="historyList" stripe>
              <el-table-column prop="customer_name" label="顾客" width="120" />
              <el-table-column
                prop="package_name"
                label="套餐"
                min-width="120"
              />
              <el-table-column prop="start_time" label="开始时间" width="170" />
              <el-table-column prop="end_time" label="结束时间" width="170" />
              <el-table-column label="时长" width="80">
                <template #default="{ row }">
                  {{ formatDuration(row) }}
                </template>
              </el-table-column>
              <el-table-column prop="staff_name" label="核销人员" width="80" />
              <template #empty>
                <el-empty description="暂无历史记录" :image-size="60" />
              </template>
            </el-table>
            <el-pagination
              v-if="historyTotal > 0"
              v-model:current-page="historyPage"
              v-model:page-size="historySize"
              :total="historyTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              style=" justify-content: flex-end;margin-top: 12px"
              @size-change="
                () => {
                  historyPage = 1;
                  loadHistory();
                }
              "
              @current-change="loadHistory"
            />
          </template>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.tab-link {
  padding: 4px 0;
  font-size: 14px;
  color: #909399;
  border-bottom: 2px solid transparent;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.tab-link:hover {
  color: #409eff;
}

.tab-active {
  font-weight: 600;
  color: #303133;
  border-bottom-color: #409eff;
}
</style>
