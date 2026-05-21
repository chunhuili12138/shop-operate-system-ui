<script setup lang="ts">
import { ref, watch } from "vue";
import { getPurchaseSessions } from "@/api/trade";
import type { CustomerSessionDetail } from "@/api/trade";
import { formatDate } from "@/utils/date";

interface Props {
  visible: boolean;
  purchaseId: number;
  packageName: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const sessions = ref<CustomerSessionDetail[]>([]);
const loading = ref(false);

const statusMap: Record<number, { text: string; type: string }> = {
  1: { text: "可用", type: "primary" },
  2: { text: "已核销", type: "success" },
  3: { text: "已过期", type: "info" },
  4: { text: "已退款", type: "danger" }
};

const load = async () => {
  if (!props.purchaseId) return;
  loading.value = true;
  try {
    const r = await getPurchaseSessions(props.purchaseId);
    if (r?.success) sessions.value = r.data || [];
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  val => {
    if (val) load();
  }
);
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="场次明细"
    size="480px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div style="margin-bottom: 12px; font-size: 14px; color: #606266">
      套餐: <b>{{ packageName }}</b>
    </div>
    <el-table v-loading="loading" :data="sessions" stripe size="small">
      <el-table-column type="index" label="#" width="50" />
      <el-table-column label="日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.session_date) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
            {{ statusMap[row.status]?.text || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="used_at" label="核销时间" min-width="140">
        <template #default="{ row }">{{ row.used_at || "-" }}</template>
      </el-table-column>
      <template #empty
        ><el-empty description="暂无数据" :image-size="40"
      /></template>
    </el-table>
    <div style="margin-top: 8px; font-size: 12px; color: #909399">
      共 {{ sessions.length }} 条场次记录
    </div>
  </el-drawer>
</template>
