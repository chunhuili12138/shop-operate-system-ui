<script setup lang="ts">
import { reactive, ref } from "vue";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";
import { createTenant, updateTenant } from "@/api/tenant";

const props = defineProps<{
  visible: boolean;
  isEdit: boolean;
  formData?: any;
}>();

const emit = defineEmits(["update:visible", "success"]);

const formRef = ref<FormInstance>();
const form = reactive({
  staffId: null as number | null,
  name: "",
  phone: "",
  username: "",
  password: "",
  maxSeats: null as number | null,
  remark: ""
});

// 监听 props 变化，同步表单数据
const syncFormData = () => {
  if (props.formData) {
    Object.assign(form, props.formData);
  } else {
    // 重置表单
    Object.assign(form, {
      staffId: null,
      name: "",
      phone: "",
      username: "",
      password: "",
      maxSeats: null,
      remark: ""
    });
  }
};

const save = async () => {
  const r = props.isEdit ? await updateTenant(form) : await createTenant(form);
  if (r?.success) {
    message("保存成功", { type: "success" });
    emit("update:visible", false);
    emit("success");
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const handleClose = () => {
  emit("update:visible", false);
};

defineExpose({
  syncFormData
});
</script>

<template>
  <div>
    <el-dialog
      :model-value="visible"
      :title="isEdit ? '编辑商户' : '新增商户'"
      width="500px"
      class="dialog-sm"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
