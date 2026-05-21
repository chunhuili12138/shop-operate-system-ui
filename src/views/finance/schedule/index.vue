<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { getStaffSchedules, addStaffSchedule, updateStaffSchedule, deleteStaffSchedule } from "@/api/finance";
import { getStaffList } from "@/api/system";

defineOptions({ name: "FinanceSchedule" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const staffList = ref<any[]>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive({ scheduleId: 0, staffId: 0, scheduleDate: "", startTime: "", endTime: "", type: 1, remark: "" });

const load = async () => {
  loading.value = true;
  try {
    const r = await getStaffSchedules({ page: page.value, size: size.value });
    if (r?.success) {
      tableData.value = r.data?.list || [];
      total.value = r.data?.total || 0;
    }
  } finally { loading.value = false; }
};

const loadStaff = async () => {
  try {
    const r = await getStaffList({ page: 1, size: 200 });
    if (r?.success) staffList.value = r.data?.list || [];
  } catch { /* ignore */ }
};

const onSizeChange = (s: number) => { size.value = s; page.value = 1; load(); };

const openAdd = () => {
  isEdit.value = false;
  Object.assign(form, { scheduleId: 0, staffId: 0, scheduleDate: "", startTime: "", endTime: "", type: 1, remark: "" });
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(form, {
    scheduleId: row.id, staffId: Number(row.staff_id), scheduleDate: String(row.schedule_date),
    startTime: String(row.start_time).substring(0, 5), endTime: String(row.end_time).substring(0, 5),
    type: row.type || 1, remark: row.remark || ""
  });
  dialogVisible.value = true;
};

const save = async () => {
  const r = isEdit.value ? await updateStaffSchedule(form as any) : await addStaffSchedule(form as any);
  if (r?.success) { message(isEdit.value ? "更新成功" : "新增成功", { type: "success" }); dialogVisible.value = false; load(); }
  else message(r?.msg || "失败", { type: "warning" });
};

const onDelete = async (id: number) => {
  try { await ElMessageBox.confirm("确认删除？", "提示", { type: "warning" }); }
  catch { return; }
  const r = await deleteStaffSchedule(id);
  if (r?.success) { message("已删除", { type: "success" }); load(); }
  else message(r?.msg || "失败", { type: "warning" });
};

onMounted(() => { load(); loadStaff(); });
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div><el-button type="primary" @click="openAdd">新增排班</el-button></div>
      <div><el-button @click="load">刷新</el-button></div>
    </div>
    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" style="width:100%">
        <el-table-column prop="staff_name" label="员工" width="100" />
        <el-table-column prop="schedule_date" label="日期" width="120" />
        <el-table-column prop="start_time" label="开始" width="80" />
        <el-table-column prop="end_time" label="结束" width="80" />
        <el-table-column label="类型" width="70" align="center">
          <template #default="{ row }">{{ row.type === 2 ? "休息" : "上班" }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无排班记录" /></template>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="page" v-model:page-size="size" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination" @size-change="onSizeChange" @current-change="load"
    />

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑排班' : '新增排班'" width="450px" :close-on-click-modal="false">
      <el-form :model="form" label-width="80px">
        <el-form-item label="员工" required>
          <el-select v-model="form.staffId" filterable style="width:100%" :disabled="isEdit">
            <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" required>
          <el-date-picker v-model="form.scheduleDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-time-picker v-model="form.startTime" format="HH:mm" value-format="HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-time-picker v-model="form.endTime" format="HH:mm" value-format="HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="上班" :value="1" />
            <el-option label="休息" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
