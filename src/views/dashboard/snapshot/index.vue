<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { getDailySnapshots } from "@/api/dashboard";
import { formatDate } from "@/utils/date";

defineOptions({ name: "DashboardSnapshot" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({ startDate: "", endDate: "" });

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
      >
        <el-table-column prop="snapshot_date" label="日期" min-width="170">
          <template #default="{ row }">
            <div>{{ formatDate(row.snapshot_date) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="sales_total" label="销售额" width="150" />
        <el-table-column
          prop="revenue_confirmed"
          label="确认收入"
          min-width="150"
        />
        <el-table-column
          prop="new_customers"
          label="新顾客"
          min-width="150"
          align="center"
        />
        <el-table-column
          prop="active_sessions"
          label="活跃场次"
          min-width="120"
          align="center"
        />
        <el-table-column
          prop="average_duration"
          label="平均时长(分)"
          min-width="120"
        />
        <template #empty><el-empty description="暂无快照数据" /></template>
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
