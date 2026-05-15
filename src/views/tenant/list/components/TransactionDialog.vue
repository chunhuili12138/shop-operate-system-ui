<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getTransactionList } from "@/api/tenant";
import { getDictData } from "@/api/system";

const props = defineProps<{
  visible: boolean;
  staffId: number;
}>();

const emit = defineEmits(["update:visible"]);

const txList = ref([]);
const paymentMethods = ref([] as any[]);

const loadPaymentMethods = async () => {
  try {
    const r = await getDictData({ dictCode: "payment_method" });
    if (r?.success) paymentMethods.value = r.data || [];
  } catch {
    /* ignore */
  }
};

const getPaymentMethodLabel = (value: string) => {
  const item = paymentMethods.value.find(pm => pm.dict_label === value);
  return item ? item.dict_value : value;
};

const openTx = async () => {
  const r = await getTransactionList(props.staffId);
  if (r?.success) txList.value = r.data || [];
};

const handleClose = () => {
  emit("update:visible", false);
};

onMounted(() => {
  loadPaymentMethods();
});

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
        <el-table-column label="支付方式">
          <template #default="{ row }">
            {{ getPaymentMethodLabel(row.payment_method) }}
          </template>
        </el-table-column>
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
