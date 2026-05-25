<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { message } from "@/utils/message";
import { updateProfile, changeOwnPassword } from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";
import type { FormInstance, FormRules } from "element-plus";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits(["update:visible"]);

const userStore = useUserStoreHook();
const activeTab = ref("info");
const saving = ref(false);

// ---- 信息表单 ----
const infoFormRef = ref<FormInstance>();
const infoForm = reactive({
  name: "",
  phone: ""
});

const infoRules: FormRules = {
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }]
};

// ---- 密码表单 ----
const pwdFormRef = ref<FormInstance>();
const pwdForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

const validateConfirm = (_rule: any, value: string, callback: Function) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error("两次密码不一致"));
  } else {
    callback();
  }
};

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码至少6位", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    { validator: validateConfirm, trigger: "blur" }
  ]
};

watch(
  () => props.visible,
  val => {
    if (val) {
      infoForm.name = userStore.nickname || userStore.username || "";
      infoForm.phone = userStore.phone || "";
      pwdForm.oldPassword = "";
      pwdForm.newPassword = "";
      pwdForm.confirmPassword = "";
      activeTab.value = "info";
    }
  }
);

// 保存信息
const saveInfo = async () => {
  const valid = await infoFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const r: any = await updateProfile({
      name: infoForm.name,
      phone: infoForm.phone
    });
    if (r?.success) {
      userStore.SET_NICKNAME(infoForm.name);
      userStore.SET_USERNAME(infoForm.name);
      message("保存成功", { type: "success" });
    } else {
      message(r?.msg || "保存失败", { type: "warning" });
    }
  } finally {
    saving.value = false;
  }
};

// 修改密码
const savePwd = async () => {
  const valid = await pwdFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const r: any = await changeOwnPassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    });
    if (r?.success) {
      message("密码修改成功", { type: "success" });
      pwdForm.oldPassword = "";
      pwdForm.newPassword = "";
      pwdForm.confirmPassword = "";
      activeTab.value = "info";
    } else {
      message(r?.msg || "修改失败", { type: "warning" });
    }
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="个人中心"
    width="520px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本信息" name="info">
        <el-form
          ref="infoFormRef"
          :model="infoForm"
          :rules="infoRules"
          label-width="80px"
          style="padding: 8px 0"
        >
          <el-form-item label="账号">
            <el-input :model-value="userStore.username" disabled />
          </el-form-item>
          <el-form-item label="姓名" prop="name">
            <el-input v-model="infoForm.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="infoForm.phone" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item label="角色">
            <el-tag
              v-for="role in userStore.roles"
              :key="role"
              size="small"
              style="margin-right: 6px"
            >
              {{ role }}
            </el-tag>
          </el-form-item>
        </el-form>
        <div style=" margin-top: 12px;text-align: center">
          <el-button type="primary" :loading="saving" @click="saveInfo">
            保存
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="修改密码" name="password">
        <el-form
          ref="pwdFormRef"
          :model="pwdForm"
          :rules="pwdRules"
          label-width="80px"
          style="padding: 8px 0"
        >
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input
              v-model="pwdForm.oldPassword"
              type="password"
              show-password
              placeholder="请输入旧密码"
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="pwdForm.newPassword"
              type="password"
              show-password
              placeholder="请输入新密码（至少6位）"
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="pwdForm.confirmPassword"
              type="password"
              show-password
              placeholder="请再次输入新密码"
            />
          </el-form-item>
        </el-form>
        <div style=" margin-top: 12px;text-align: center">
          <el-button type="primary" :loading="saving" @click="savePwd">
            修改密码
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>
