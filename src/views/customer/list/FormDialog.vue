<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { message } from "@/utils/message";
import type { FormInstance, FormRules } from "element-plus";
import { addCustomer, updateCustomer, type CustomerFormParams } from "@/api/customer";

const props = defineProps<{
  visible: boolean;
  mode: "add" | "edit";
  data?: CustomerFormParams | null;
}>();

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "submit"): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive<CustomerFormParams>({
  customersId: null,
  nickname: "",
  phone: "",
  gender: null,
  birthday: "",
  remark: "",
  tags: ""
});

const rules: FormRules = {
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号格式", trigger: "blur" }
  ]
};

watch(
  () => props.visible,
  (v) => {
    if (v) {
      if (props.mode === "edit" && props.data) {
        Object.assign(form, { ...props.data });
      } else {
        Object.assign(form, {
          customersId: null,
          nickname: "",
          phone: "",
          gender: null,
          birthday: "",
          remark: "",
          tags: ""
        });
      }
      formRef.value?.clearValidate();
    }
  }
);

const handleClose = () => {
  emit("update:visible", false);
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    const api = props.mode === "add" ? addCustomer : updateCustomer;
    const r = await api({ ...form });
    if (r?.success) {
      message(props.mode === "add" ? "新增成功" : "编辑成功", { type: "success" });
      emit("update:visible", false);
      emit("submit");
    } else {
      message(r?.msg || "操作失败", { type: "warning" });
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="mode === 'add' ? '新增顾客' : '编辑顾客'"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" placeholder="请输入昵称" maxlength="50" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="form.gender" clearable placeholder="请选择" style="width:100%">
          <el-option label="男" :value="1" />
          <el-option label="女" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="生日">
        <el-input v-model="form.birthday" placeholder="yyyy-MM-dd" />
      </el-form-item>
      <el-form-item label="标签">
        <el-input v-model="form.tags" placeholder="多个用逗号分隔" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" maxlength="200" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ mode === "add" ? "保存" : "更新" }}
      </el-button>
    </template>
  </el-dialog>
</template>
