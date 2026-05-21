<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils/message";
import { getAttendanceRecords, checkIn, checkOut } from "@/api/finance";

defineOptions({ name: "FinanceAttendance" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const statusMap: Record<number, string> = { 1: "正常", 2: "迟到", 3: "早退", 4: "加班" };

const load = async () => {
  loading.value = true;
  try {
    const r = await getAttendanceRecords({ page: page.value, size: size.value });
    if (r?.success) {
      tableData.value = r.data?.list || [];
      total.value = r.data?.total || 0;
    }
  } finally { loading.value = false; }
};

const onSizeChange = (s: number) => { size.value = s; page.value = 1; load(); };

const onCheckIn = async () => {
  const r = await checkIn();
  if (r?.success) { message("打卡成功", { type: "success" }); load(); }
  else message(r?.msg || "打卡失败", { type: "warning" });
};

const onCheckOut = async (recordId: number) => {
  const r = await checkOut(recordId);
  if (r?.success) { message("签退成功", { type: "success" }); load(); }
  else message(r?.msg || "签退失败", { type: "warning" });
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div><el-button type="primary" @click="onCheckIn">打卡签到</el-button></div>
      <div><el-button @click="load">刷新</el-button></div>
    </div>
    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" style="width:100%">
        <el-table-column prop="staff_name" label="员工" width="120" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="check_in_time" label="签到时间" width="170" />
        <el-table-column prop="check_out_time" label="签退时间" width="170" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">{{ statusMap[row.status] || row.status }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button v-if="!row.check_out_time" link type="primary" @click="onCheckOut(row.id)">签退</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无考勤记录" /></template>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="page" v-model:page-size="size" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination" @size-change="onSizeChange" @current-change="load"
    />
  </div>
</template>
