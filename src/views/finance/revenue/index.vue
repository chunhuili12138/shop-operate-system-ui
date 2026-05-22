<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { getRevenueList, getRevenueSummary } from "@/api/finance";

defineOptions({ name: "FinanceRevenue" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({ dateRange: [] as string[] });
const summary = reactive({ totalRevenue: 0, totalCount: 0, avgAmount: 0 });

const loadSummary = async () => {
  const params: any = {};
  if (query.dateRange?.length === 2) {
    params.startDate = query.dateRange[0];
    params.endDate = query.dateRange[1];
  }
  const r = await getRevenueSummary(params);
  if (r?.success) Object.assign(summary, r.data);
};

const load = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, size: size.value };
    if (query.dateRange?.length === 2) {
      params.startDate = query.dateRange[0];
      params.endDate = query.dateRange[1];
    }
    const r = await getRevenueList(params);
    if (r?.success) {
      tableData.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  page.value = 1;
  load();
  loadSummary();
};
const onReset = () => {
  query.dateRange = [];
  page.value = 1;
  load();
  loadSummary();
};
const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const sourceLabel = (val: string) => {
  const map: Record<string, string> = {
    wallet: "储值钱包",
    wechat: "微信",
    alipay: "支付宝",
    cash: "现金",
    other: "其他"
  };
  return map[val] || val || "-";
};

onMounted(() => {
  load();
  loadSummary();
});
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline class="page-search">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="query.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            @change="onSearch"
          />
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </div>
        <div><el-button @click="load">刷新</el-button></div>
      </div>
    </div>

    <el-row :gutter="16" class="summary-row">
      <el-col :span="8">
        <el-card shadow="never">
          <div class="text-sm text-dim">总收入</div>
          <div class="text-2xl font-bold" style="color: #667eea">
            ¥{{ summary.totalRevenue ?? 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <div class="text-sm text-dim">记录数</div>
          <div class="text-2xl font-bold" style="color: #f5576c">
            {{ summary.totalCount ?? 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <div class="text-sm text-dim">笔均收入</div>
          <div class="text-2xl font-bold" style="color: #4facfe">
            ¥{{ (summary.avgAmount ?? 0).toFixed(2) }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="customer_name" label="顾客" width="150" />
        <el-table-column prop="package_name" label="套餐" min-width="120" />
        <el-table-column label="金额" width="110" align="center">
          <template #default="{ row }">
            <span
              :style="{
                color: Number(row.amount) < 0 ? 'var(--el-color-danger)' : ''
              }"
            >
              ¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="100" align="center">
          <template #default="{ row }">{{
            sourceLabel(row.payment_method)
          }}</template>
        </el-table-column>
        <el-table-column prop="staff_name" label="确认员工" width="100" />
        <el-table-column prop="confirmed_at" label="确认时间" width="170" />
        <template #empty><el-empty description="暂无收入记录" /></template>
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
  </div>
</template>

<style scoped>
.summary-row {
  margin-bottom: 16px;
}
.summary-row .el-card {
  border: 1px solid var(--el-border-color-light);
}
.summary-row :deep(.el-card__body) {
  padding: 16px;
}
</style>
