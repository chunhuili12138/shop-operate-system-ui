<script setup lang="ts">
import { ref, watch } from "vue";
import { ElForm, ElFormItem, ElInputNumber, ElButton } from "element-plus";

interface Props {
  visible: boolean;
  orderId?: number;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "success", amount: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref();
const formData = ref({
  amount: 0
});

const dialogVisible = ref(false);

watch(
  () => props.visible,
  (val) => {
    dialogVisible.value = val;
    if (val) {
      // 重置表单
      formData.value.amount = 0;
    }
  }
);

watch(dialogVisible, (val) => {
  emit("update:visible", val);
});

const handleClose = () => {
  dialogVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid: boolean) => {
    if (valid) {
      emit("success", formData.value.amount);
      dialogVisible.value = false;
    }
  });
};

const rules = {
  amount: [
    { required: true, message: "请输入付款金额", trigger: "blur" },
    {
      validator: (_rule: any, value: number, callback: any) => {
        if (value <= 0) {
          callback(new Error("付款金额必须大于0"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="付款"
    width="400px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="付款金额" prop="amount">
        <el-input-number
          v-model="formData.amount"
          :min="0"
          :precision="2"
          :step="1"
          controls-position="right"
          style="width: 100%"
          placeholder="请输入付款金额"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>
