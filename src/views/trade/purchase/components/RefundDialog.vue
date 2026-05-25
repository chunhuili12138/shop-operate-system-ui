<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "@/utils/message";
import { getRefundPreview, applyRefund, type RefundPreview } from "@/api/trade";

interface Props {
  visible: boolean;
  purchaseId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const preview = ref<RefundPreview | null>(null);
const loading = ref(false);
const saving = ref(false);
const refundAmount = ref(0);
const reason = ref("");
const maxAmount = ref(0);

const loadPreview = async () => {
  preview.value = null;
  if (!props.purchaseId) return;
  loading.value = true;
  try {
    const r = await getRefundPreview(props.purchaseId);
    if (r?.success && r.data) {
      preview.value = r.data;
      refundAmount.value = r.data.suggested_amount;
      maxAmount.value = r.data.paid_amount;
    }
  } catch {
    /* ignore */
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  val => {
    if (val) {
      reason.value = "";
      loadPreview();
    }
  }
);

const handleClose = () => emit("update:visible", false);

const handleSubmit = async () => {
  if (!reason.value.trim()) {
    message("请输入退款原因", { type: "warning" });
    return;
  }
  if (refundAmount.value > maxAmount.value) {
    message("退款金额不能超过实付金额 ¥" + maxAmount.value.toFixed(2), {
      type: "warning"
    });
    return;
  }
  if (refundAmount.value < 0) {
    message("退款金额不能为负数", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    const r = await applyRefund(
      props.purchaseId,
      reason.value,
      refundAmount.value
    );
    if (r?.success) {
      message("退款申请已提交", { type: "success" });
      emit("update:visible", false);
      emit("success");
    } else {
      message(r?.msg || "退款申请失败", { type: "warning" });
    }
  } catch {
    message("网络异常", { type: "error" });
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="申请退款"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading" style="min-height: 120px">
      <template v-if="preview">
        <div
          style="
            padding: 12px;
            margin-bottom: 16px;
            background: #f5f7fa;
            border-radius: 4px;
          "
        >
          <div style="display: flex; gap: 16px; font-size: 13px">
            <span
              >总场次: <b>{{ preview.total_sessions }}</b></span
            >
            <span style="color: #67c23a"
              >已核销: <b>{{ preview.used_sessions }}</b></span
            >
            <span style="color: #909399"
              >已过期: <b>{{ preview.expired_sessions }}</b></span
            >
            <span style="color: #409eff"
              >剩余: <b>{{ preview.remaining_sessions }}</b></span
            >
          </div>
          <div style="margin-top: 8px; font-size: 13px; color: #909399">
            建议退款:
            <b style="color: #e6a23c"
              >¥{{ preview.suggested_amount.toFixed(2) }}</b
            >
            &nbsp;实付: ¥{{ preview.paid_amount.toFixed(2) }}
          </div>
        </div>
        <el-form label-width="80px">
          <el-form-item label="退款金额">
            <el-input-number
              v-model="refundAmount"
              :min="0"
              :max="maxAmount"
              :precision="2"
              :step="1"
              style="width: 100%"
            />
            <div style="margin-top: 4px; font-size: 12px; color: #909399">
              上限: 实付金额 ¥{{ maxAmount.toFixed(2) }}
            </div>
          </el-form-item>
          <el-form-item label="退款原因">
            <el-input
              v-model="reason"
              type="textarea"
              placeholder="请输入退款原因"
              :rows="3"
            />
          </el-form-item>
        </el-form>
      </template>
      <el-empty
        v-else-if="!loading"
        description="加载退款信息失败"
        :image-size="60"
      />
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="danger"
        :loading="saving"
        :disabled="!preview"
        @click="handleSubmit"
      >
        确认退款 (¥{{ refundAmount.toFixed(2) }})
      </el-button>
    </template>
  </el-dialog>
</template>
