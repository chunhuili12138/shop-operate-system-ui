<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getFeedbackList } from "@/api/feedback";
import { getDictData } from "@/api/dict";
import ReplyDialog from "./components/ReplyDialog.vue";

defineOptions({ name: "Feedback" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const typeDict = ref<any[]>([]);
const statusDict = ref<any[]>([]);
const replyVisible = ref(false);
const currentRow = ref<any>(null);

const typeLabel = (t: number) => {
  const item = typeDict.value.find((d: any) => d.dict_key === t);
  return item ? item.dict_value : String(t);
};
const statusLabel = (s: number) => {
  const item = statusDict.value.find((d: any) => d.dict_key === s);
  return item ? item.dict_value : String(s);
};
const statusType = (s: number): any =>
  (({ 1: "warning", 2: "success", 3: "info" }) as any)[s] || "info";

const load = async () => {
  loading.value = true;
  try {
    const r = await getFeedbackList({ page: page.value, size: size.value });
    if (r?.success) {
      tableData.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const openReply = (row: any) => {
  currentRow.value = row;
  replyVisible.value = true;
};

const loadDicts = async () => {
  try {
    const [t, s] = await Promise.all([
      getDictData("feedback_type"),
      getDictData("feedback_status")
    ]);
    if (t?.success && Array.isArray(t.data)) typeDict.value = t.data;
    if (s?.success && Array.isArray(s.data)) statusDict.value = s.data;
  } catch {
    /* ignore */
  }
};

const onSizeChange = (v: number) => {
  size.value = v;
  page.value = 1;
  load();
};

onMounted(() => {
  loadDicts();
  load();
});
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-actions">
        <div />
        <div><el-button type="primary" @click="load">刷新</el-button></div>
      </div>
    </div>
    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="customer_name" label="顾客" width="100" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">{{
            typeLabel(row.feedback_type)
          }}</template>
        </el-table-column>
        <el-table-column label="评分" width="110" align="center">
          <template #default="{ row }">{{
            row.rating ? "★".repeat(row.rating) : "-"
          }}</template>
        </el-table-column>
        <el-table-column
          prop="content"
          label="内容"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{
              statusLabel(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="120" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              link
              type="primary"
              size="small"
              @click="openReply(row)"
              >回复</el-button
            >
            <span v-else class="text-dim text-xs">-</span>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无评价" /></template>
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
    <ReplyDialog
      v-model:visible="replyVisible"
      :data="currentRow"
      @success="load"
    />
  </div>
</template>
