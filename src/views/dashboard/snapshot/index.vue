<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue";
import { getDailySnapshots } from "@/api/dashboard";
import { formatDate } from "@/utils/date";

defineOptions({ name: "DashboardSnapshot" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({ startDate: "", endDate: "" });
const detailVisible = ref(false);
const detailData = ref<any>(null);

const summary = computed(() => {
  if (!tableData.value.length) return null;
  let sales = 0,
    revenue = 0,
    expense = 0,
    customers = 0,
    sessions = 0,
    durationSum = 0,
    durationCount = 0;
  tableData.value.forEach(v => {
    sales += Number(v.sales_total) || 0;
    revenue += Number(v.revenue_confirmed) || 0;
    expense += Number(v.expense_total) || 0;
    customers += Number(v.new_customers) || 0;
    sessions += Number(v.active_sessions) || 0;
    if (v.average_duration) {
      durationSum += Number(v.average_duration);
      durationCount++;
    }
  });
  return {
    sales,
    revenue,
    expense,
    customers,
    sessions,
    avgDuration: durationCount ? durationSum / durationCount : 0
  };
});

const formatMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? "-" : `¥${n.toFixed(2)}`;
};

const load = async () => {
  loading.value = true;
  try {
    const r = await getDailySnapshots({
      page: page.value,
      size: size.value,
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined
    });
    if (r?.success) {
      tableData.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const openDetail = (row: any) => {
  detailData.value = row;
  detailVisible.value = true;
};

const reset = () => {
  query.startDate = "";
  query.endDate = "";
  page.value = 1;
  load();
};
const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="query.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="开始时间"
            style="width: 140px"
          />
          <span style="margin: 0 8px">~</span>
          <el-date-picker
            v-model="query.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="结束时间"
            style="width: 140px"
          />
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div />
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>
    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        style="width: 100%"
        show-summary
        :summary-method="() => []"
      >
        <el-table-column prop="snapshot_date" label="日期" min-width="120">
          <template #default="{ row }">{{
            formatDate(row.snapshot_date)
          }}</template>
        </el-table-column>
        <el-table-column label="销售额" min-width="120" align="right">
          <template #default="{ row }">{{
            formatMoney(row.sales_total)
          }}</template>
        </el-table-column>
        <el-table-column label="确认收入" min-width="120" align="right">
          <template #default="{ row }">{{
            formatMoney(row.revenue_confirmed)
          }}</template>
        </el-table-column>
        <el-table-column label="支出" min-width="120" align="right">
          <template #default="{ row }">{{
            formatMoney(row.expense_total)
          }}</template>
        </el-table-column>
        <el-table-column
          prop="new_customers"
          label="新顾客"
          min-width="80"
          align="center"
        />
        <el-table-column
          prop="active_sessions"
          label="活跃场次"
          min-width="90"
          align="center"
        />
        <el-table-column label="平均时长(分)" min-width="110" align="center">
          <template #default="{ row }">{{
            row.average_duration ?? "-"
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="70" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)"
              >详情</el-button
            >
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无快照数据" /></template>
      </el-table>
      <div v-if="summary" class="summary-bar">
        <span>合计：</span>
        <span>销售额 {{ formatMoney(summary.sales) }}</span>
        <el-divider direction="vertical" />
        <span>收入 {{ formatMoney(summary.revenue) }}</span>
        <el-divider direction="vertical" />
        <span>支出 {{ formatMoney(summary.expense) }}</span>
        <el-divider direction="vertical" />
        <span>新顾客 {{ summary.customers }}</span>
        <el-divider direction="vertical" />
        <span>场次 {{ summary.sessions }}</span>
      </div>
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

    <el-drawer v-model="detailVisible" title="快照详情" size="400px">
      <template v-if="detailData">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="日期">{{
            formatDate(detailData.snapshot_date)
          }}</el-descriptions-item>
          <el-descriptions-item label="销售额">{{
            formatMoney(detailData.sales_total)
          }}</el-descriptions-item>
          <el-descriptions-item label="确认收入">{{
            formatMoney(detailData.revenue_confirmed)
          }}</el-descriptions-item>
          <el-descriptions-item label="支出">{{
            formatMoney(detailData.expense_total)
          }}</el-descriptions-item>
          <el-descriptions-item label="新顾客">{{
            detailData.new_customers ?? "-"
          }}</el-descriptions-item>
          <el-descriptions-item label="活跃场次">{{
            detailData.active_sessions ?? "-"
          }}</el-descriptions-item>
          <el-descriptions-item label="平均时长(分)">{{
            detailData.average_duration ?? "-"
          }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="detailData?.inventory_warns" style="margin-top: 16px">
          <div class="font-medium mb-2">库存预警</div>
          <el-table :data="JSON.parse(detailData.inventory_warns)" size="small">
            <el-table-column prop="name" label="物料" />
            <el-table-column prop="quantity" label="库存" width="60" />
            <el-table-column prop="minStock" label="预警线" width="60" />
          </el-table>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  align-items: center;
  padding: 8px 16px;
  margin-top: 12px;
  font-size: 13px;
  color: #666;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.summary-bar span {
  margin-right: 4px;
}

.summary-bar .el-divider--vertical {
  height: 14px;
  margin: 0 8px;
}
</style>
