<script setup lang="ts">
import { ref } from "vue";
import { message } from "@/utils/message";
import { resetTenantPassword } from "@/api/tenant";

const props = defineProps<{
  visible: boolean;
  staffId: number;
}>();

const emit = defineEmits(["update:visible"]);

const newPwd = ref("");

const doResetPwd = async () => {
  if (!newPwd.value) return;
  const r = await resetTenantPassword(props.staffId, newPwd.value);
  if (r?.success) {
    message("密码已重置", { type: "success" });
    emit("update:visible", false);
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const handleClose = () => {
  emit("update:visible", false);
  newPwd.value = "";
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="重置密码"
    width="400px"
    class="dialog-xs"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form label-width="100px">
      <el-form-item label="新密码">
        <el-input v-model="newPwd" type="password" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="doResetPwd">确认重置</el-button>
    </template>
  </el-dialog>
</template>
