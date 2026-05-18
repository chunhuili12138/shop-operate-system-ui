<script setup lang="ts">
import { ref } from "vue";
import { message } from "@/utils/message";
import { resetStaffPassword } from "@/api/system";

const props = defineProps<{
  visible?: boolean;
  staffId?: number;
}>();

const emit = defineEmits(["update:visible", "success"]);

const newPwd = ref("");

const doResetPwd = async () => {
  if (!newPwd.value) {
    message("请输入新密码", { type: "warning" });
    return;
  }
  const res = await resetStaffPassword({
    staffId: props.staffId,
    newPassword: newPwd.value
  });
  if (res?.success) {
    message("密码已重置", { type: "success" });
    emit("update:visible", false);
    emit("success");
  } else {
    message(res?.msg || "失败", { type: "warning" });
  }
};

const handleClose = () => {
  emit("update:visible", false);
  newPwd.value = "";
};
</script>

<template>
  <div>
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
          <el-input
            v-model="newPwd"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
          <div class="text-xs text-gray-500 mt-1">
            密码要求：8-20位，包含字母和数字
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="doResetPwd">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>
