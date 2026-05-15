<script setup lang="ts">
import { reactive, ref, watch } from "vue";
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

// 监听 props.formData 变化，自动同步表单数据
watch(
  () => props.formData,
  newData => {
    if (newData) {
      Object.assign(form, newData);
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
  },
  { immediate: true }
);

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
          <el-input v-model="form.name" placeholder="请输入商户名称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
