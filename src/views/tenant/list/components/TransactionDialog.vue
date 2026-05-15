<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { getTransactionList, refundTransaction } from "@/api/tenant";
import { getDictData } from "@/api/system";

const props = defineProps<{
  visible: boolean;
  staffId: number;
}>();

const emit = defineEmits(["update:visible"]);

const txList = ref([]);
const paymentMethods = ref([] as any[]);

const refundDialog = ref(false);
const currentTx = ref<any>(null);
const refundForm = ref({ amount: 0, deductedDays: 0 });
const totalDays = computed(() => {
  if (!currentTx.value) return 0;
  const type = currentTx.value.subscription_type;
  const num = currentTx.value.subscription_num || 1;
  return type === 2 ? 365 * num : 30 * num;
});

const loadPaymentMethods = async () => {
  try {
    const r = await getDictData({ dictCode: "payment_method" });
    if (r?.success) paymentMethods.value = r.data || [];
  } catch {
    /* ignore */
  }
};

const getPaymentMethodLabel = (value: string) => {
  const item = paymentMethods.value.find((pm: any) => pm.dict_label === value);
  return item ? item.dict_value : value;
};

const openTx = async () => {
  const r = await getTransactionList(props.staffId);
  if (r?.success) txList.value = r.data || [];
};

const onRefundAmountChange = () => {
  if (!currentTx.value) return;
  const ratio = refundForm.value.amount / currentTx.value.amount;
  refundForm.value.deductedDays = Math.round(totalDays.value * ratio);
};

const onDeductedDaysChange = () => {
  if (!currentTx.value) return;
  const ratio = refundForm.value.deductedDays / totalDays.value;
  refundForm.value.amount =
    Math.round(currentTx.value.amount * ratio * 100) / 100;
};

const openRefund = (row: any) => {
  currentTx.value = row;
  refundForm.value.amount = row.amount;
  refundForm.value.deductedDays = totalDays.value;
  refundDialog.value = true;
};

const doRefund = async () => {
  if (!currentTx.value) return;
  if (
    refundForm.value.amount <= 0 ||
    refundForm.value.amount > currentTx.value.amount
  ) {
    message("退款金额需在 0 到原金额之间", { type: "warning" });
    return;
  }
  if (
    refundForm.value.deductedDays <= 0 ||
    refundForm.value.deductedDays > totalDays.value
  ) {
    message("扣除天数需在 1 到 " + totalDays.value + " 之间", {
      type: "warning"
    });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认退款 ¥${refundForm.value.amount}，扣除 ${refundForm.value.deductedDays} 天？`,
      "退款确认"
    );
  } catch {
    return;
  }
  const r = await refundTransaction({
    transactionId: currentTx.value.id,
    refundAmount: refundForm.value.amount,
    deductedDays: refundForm.value.deductedDays
  });
  if (r?.success) {
    message("退款成功", { type: "success" });
    refundDialog.value = false;
    openTx();
  } else {
    message(r?.msg || "退款失败", { type: "warning" });
  }
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
      width="1050px"
      class="dialog-lg"
      @close="handleClose"
    >
      <el-table :data="txList" style="width: 100%">
        <el-table-column prop="seat_no" label="席位号" width="130" />
        <el-table-column prop="amount" label="金额" width="100" />
        <el-table-column label="退款金额" width="100" align="center">
          <template #default="{ row }">
            {{ row.status === 2 ? "¥" + row.refund_amount : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="扣除天数" width="80" align="center">
          <template #default="{ row }">
            {{ row.status === 2 ? row.refund_days + "天" : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="100">
          <template #default="{ row }">
            {{ getPaymentMethodLabel(row.payment_method) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="subscription_num"
          label="数量"
          width="60"
          align="center"
        />
        <el-table-column label="类型" width="70" align="center">
          <template #default="{ row }">
            {{ row.subscription_type === 1 ? "月付" : "年付" }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? "已支付" : "已退款" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" />
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              link
              type="warning"
              @click="openRefund(row)"
            >
              退款
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 退款弹窗 -->
    <el-dialog
      v-model="refundDialog"
      title="退款确认"
      width="440px"
      class="dialog-sm"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form label-width="100px">
        <el-form-item label="席位号">
          <span class="text-bold">{{ currentTx?.seat_no }}</span>
        </el-form-item>
        <el-form-item label="订阅">
          <span
            >{{ currentTx?.subscription_num }}
            {{ currentTx?.subscription_type === 1 ? "月" : "年" }}（{{
              currentTx?.subscription_type === 1 ? "月付" : "年付"
            }}）</span
          >
        </el-form-item>
        <el-form-item label="原金额">
          <span>¥{{ currentTx?.amount }}</span>
        </el-form-item>
        <el-form-item label="退款金额">
          <el-input-number
            v-model="refundForm.amount"
            :min="0.01"
            :max="currentTx?.amount"
            :precision="2"
            style="width: 100%"
            @change="onRefundAmountChange"
          />
        </el-form-item>
        <el-form-item label="扣除天数">
          <el-input-number
            v-model="refundForm.deductedDays"
            :min="1"
            :max="totalDays"
            style="width: 100%"
            @change="onDeductedDaysChange"
          />
          <span class="text-dim text-sm">共 {{ totalDays }} 天</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialog = false">取消</el-button>
        <el-button type="warning" @click="doRefund">确认退款</el-button>
      </template>
    </el-dialog>
  </div>
</template>
