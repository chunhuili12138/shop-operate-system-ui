<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  addSupplier,
  updateSupplier,
  type SupplierFormParams
} from "@/api/inventory";
import { message } from "@/utils/message";

interface Props {
  visible: boolean;
  isEdit: boolean;
  supplierData?: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const formRef = ref<FormInstance>();
const formLoading = ref(false);

const form = reactive<SupplierFormParams>({
  supplierId: null,
  name: "",
  contactPerson: "",
  phone: "",
  address: "",
  remark: ""
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入供应商名称", trigger: "blur" }],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号格式",
      trigger: "blur"
    }
  ]
};

const resetForm = () => {
  Object.assign(form, {
    supplierId: null,
    name: "",
    contactPerson: "",
    phone: "",
    address: "",
    remark: ""
  });
  formRef.value?.clearValidate();
};

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  formLoading.value = true;
  try {
    const api = props.isEdit ? updateSupplier : addSupplier;
    const r = await api(form);
    if (r?.success) {
      message(props.isEdit ? "编辑成功" : "新增成功", { type: "success" });
      emit("update:visible", false);
      emit("success");
    } else {
      message(r?.msg || "操作失败", { type: "warning" });
    }
  } finally {
    formLoading.value = false;
  }
};

// 监听props变化，初始化表单数据
const initForm = () => {
  if (props.isEdit && props.supplierData) {
    Object.assign(form, {
      supplierId: props.supplierData.id,
      name: props.supplierData.name,
      contactPerson: props.supplierData.contact_person,
      phone: props.supplierData.phone,
      address: props.supplierData.address,
      remark: props.supplierData.remark
    });
  } else {
    resetForm();
  }
};

defineExpose({
  resetForm,
  initForm
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑供应商' : '新增供应商'"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入供应商名称"
          maxlength="50"
        />
      </el-form-item>
      <el-form-item label="联系人">
        <el-input
          v-model="form.contactPerson"
          placeholder="请输入联系人"
          maxlength="30"
        />
      </el-form-item>
      <el-form-item label="电话" prop="phone">
        <el-input
          v-model="form.phone"
          placeholder="请输入联系电话"
          maxlength="11"
        />
      </el-form-item>
      <el-form-item label="地址">
        <el-input
          v-model="form.address"
          placeholder="请输入地址"
          maxlength="100"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="handleSave"
        >保存</el-button
      >
    </template>
  </el-dialog>
</template>
