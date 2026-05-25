<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "@/utils/message";
import { generateSettlement } from "@/api/finance";

defineOptions({ name: "SettlementGenerateDialog" });

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "success"): void;
}>();

const period = ref("");
const loading = ref(false);

watch(
  () => props.visible,
  v => {
    if (v) {
      const d = new Date();
      period.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
  }
);

const confirm = async () => {
  if (!period.value) {
    message("请输入结算周期", { type: "warning" });
    return;
  }
  loading.value = true;
  try {
    const r = await generateSettlement({ settlementPeriod: period.value });
    if (r?.success) {
      message("结算已生成", { type: "success" });
      emit("update:visible", false);
      emit("success");
    } else message(r?.msg || "生成失败", { type: "warning" });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="生成结算"
    width="400px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form label-width="80px">
      <el-form-item label="结算周期" required>
        <el-date-picker
          v-model="period"
          type="month"
          value-format="YYYY-MM"
          placeholder="选择结算月份"
          style="width: 100%"
        />
        <el-text
          type="info"
          size="small"
          style="display: block; margin-top: 4px"
        >
          系统将统计该月内所有已完成的核销场次，匹配生效的提成规则自动计算每个员工的提成金额。
        </el-text>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="confirm"
        >生成</el-button
      >
    </template>
  </el-dialog>
</template>
