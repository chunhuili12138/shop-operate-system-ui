<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@/utils/message";
import { getAttendanceRecords, checkIn, checkOut } from "@/api/finance";

defineOptions({ name: "FinanceAttendance" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({
  keyword: "",
  dateRange: [] as string[],
  status: "" as any
});

const statusMap: Record<number, string> = {
  1: "正常",
  2: "迟到",
  3: "早退",
  4: "加班"
};

const load = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, size: size.value };
    if (query.keyword) params.keyword = query.keyword;
    if (query.dateRange?.length === 2) {
      params.startDate = query.dateRange[0];
      params.endDate = query.dateRange[1];
    }
    if (query.status !== "" && query.status !== null && query.status !== undefined) {
      params.status = query.status;
    }
    const r = await getAttendanceRecords(params);
    if (r?.success) {
      tableData.value = r.data?.list || [];
      total.value = r.data?.total || 0;
    }
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  page.value = 1;
  load();
};

const onReset = () => {
  query.keyword = "";
  query.dateRange = [];
  query.status = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const onCheckIn = async () => {
  const r = await checkIn();
  if (r?.success) {
    message("打卡成功", { type: "success" });
    load();
  } else message(r?.msg || "打卡失败", { type: "warning" });
};

const onCheckOut = async (recordId: number) => {
  const r = await checkOut(recordId);
  if (r?.success) {
    message("签退成功", { type: "success" });
    load();
  } else message(r?.msg || "签退失败", { type: "warning" });
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline class="page-search">
        <el-form-item label="员工姓名">
          <el-input
            v-model="query.keyword"
            placeholder="请输入员工姓名"
            clearable
            style="width: 160px"
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item label="考勤日期">
          <el-date-picker
            v-model="query.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            clearable
            placeholder="全部状态"
            style="width: 120px"
          >
            <el-option label="正常" :value="1" />
            <el-option label="迟到" :value="2" />
            <el-option label="早退" :value="3" />
            <el-option label="加班" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="onCheckIn">打卡签到</el-button>
        </div>
        <div>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </div>
      </div>
    </div>
    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column prop="staff_name" label="员工姓名" min-width="120" />
        <el-table-column prop="date" label="考勤日期" min-width="120" />
        <el-table-column prop="check_in_time" label="签到时间" min-width="170" />
        <el-table-column prop="check_out_time" label="签退时间" min-width="170" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : row.status === 3 ? 'danger' : 'info'"
              size="small"
            >
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="!row.check_out_time"
              link
              type="primary"
              size="small"
              @click="onCheckOut(row.id)"
            >
              签退
            </el-button>
            <span v-else class="text-dim">已签退</span>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无考勤记录" /></template>
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
