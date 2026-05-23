<script setup lang="ts">
import { ref, watch } from "vue";
import { getCouponUsages } from "@/api/marketing";

defineOptions({ name: "CouponUsageDialog" });

const props = defineProps<{ visible: boolean; couponId: number }>();
const emit = defineEmits<{ (e: "update:visible", v: boolean): void }>();

const usageList = ref<any[]>([]);
const loading = ref(false);

const load = async (id: number) => {
  if (!id) return;
  loading.value = true;
  try {
    const r = await getCouponUsages({ couponId: id, page: 1, size: 200 });
    if (r?.success) usageList.value = r.data.list;
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  val => {
    if (val) load(props.couponId);
  }
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="使用记录"
    width="700px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-table v-loading="loading" :data="usageList" style="width: 100%" max-height="400">
      <el-table-column prop="customer_name" label="顾客" min-width="120" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 1 ? 'info' : row.status === 2 ? 'success' : 'warning'"
            size="small"
          >
            {{ ["", "未使用", "已使用", "已过期"][row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="received_at" label="领取时间" width="170" />
      <el-table-column prop="expires_at" label="过期时间" width="170" />
      <el-table-column prop="used_at" label="使用时间" width="170">
        <template #default="{ row }">
          {{ row.used_at || "-" }}
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>
