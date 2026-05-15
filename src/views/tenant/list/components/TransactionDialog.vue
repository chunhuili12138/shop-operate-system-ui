<script setup lang="ts">
import { ref } from "vue";
import { getTransactionList } from "@/api/tenant";

const props = defineProps<{
  visible: boolean;
  staffId: number;
}>();

const emit = defineEmits(["update:visible"]);

const txList = ref([]);

const openTx = async () => {
  const r = await getTransactionList(props.staffId);
  if (r?.success) txList.value = r.data || [];
};

const handleClose = () => {
  emit("update:visible", false);
};

defineExpose({
  openTx
});
</script>

<template>
  <div>
    <el-dialog
      :model-value="visible"
      title="席位流水"
      width="600px"
      class="dialog-lg"
      @close="handleClose"
    >
      <el-table :data="txList" style="width: 100%">
        <el-table-column prop="amount" label="金额" />
        <el-table-column prop="payment_method" label="支付方式" />
        <el-table-column label="类型">
          <template #default="{ row }">
            {{ row.subscription_type === 1 ? "月付" : "年付" }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" />
      </el-table>
    </el-dialog>
  </div>
</template>
