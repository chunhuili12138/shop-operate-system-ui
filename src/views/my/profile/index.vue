<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { message } from "@/utils/message";
import { updateProfile, changeOwnPassword, uploadUserAvatar } from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";
import type { FormInstance, FormRules } from "element-plus";

defineOptions({ name: "MyProfile" });

const userStore = useUserStoreHook();
const savingInfo = ref(false);
const savingPwd = ref(false);

// ---- 头像 ----
const avatarUploadRef = ref();
const avatarPending = ref<File | null>(null);
const avatarList = ref<any[]>([]);

const avatarPreviewUrl = ref("");

const handleAvatarChange = (uploadFile: any, uploadFiles: any[]) => {
  const raw = uploadFile.raw as File;
  if (!raw) return;
  if (
    !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(raw.type)
  ) {
    message("仅支持 jpg/png/gif/webp 格式", { type: "warning" });
    avatarUploadRef.value?.clearFiles();
    return;
  }
  if (raw.size / 1024 / 1024 > 5) {
    message("头像大小不能超过 5MB", { type: "warning" });
    avatarUploadRef.value?.clearFiles();
    return;
  }
  avatarPending.value = raw;
  avatarList.value = uploadFiles;
  avatarPreviewUrl.value = URL.createObjectURL(raw);
};

const handleAvatarRemove = () => {
  avatarPending.value = null;
  avatarList.value = [];
  avatarPreviewUrl.value = userStore.avatar
    ? `/api/file/image?name=${encodeURIComponent(userStore.avatar)}`
    : "";
};

// ---- 基本信息 ----
const infoFormRef = ref<FormInstance>();
const infoForm = reactive({ name: "", phone: "" });

const infoRules: FormRules = {
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }]
};

// ---- 修改密码 ----
const pwdFormRef = ref<FormInstance>();
const pwdForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

const validateConfirm = (_rule: any, value: string, callback: Function) => {
  if (value !== pwdForm.newPassword) callback(new Error("两次密码不一致"));
  else callback();
};

const validateNewPwd = (_rule: any, value: string, callback: Function) => {
  if (!value) {
    callback(new Error("请输入新密码"));
    return;
  }
  if (value.length < 8 || value.length > 18) {
    callback(new Error("密码长度须为8-18位"));
    return;
  }
  let types = 0;
  if (/[0-9]/.test(value)) types++;
  if (/[a-z]/.test(value)) types++;
  if (/[A-Z]/.test(value)) types++;
  if (/[^0-9a-zA-Z]/.test(value)) types++;
  if (types < 2) {
    callback(new Error("须包含数字、字母、符号中至少两种"));
    return;
  }
  if (/[\u4E00-\u9FA5]/.test(value)) {
    callback(new Error("不能包含中文"));
    return;
  }
  callback();
};

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [{ required: true, validator: validateNewPwd, trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    { validator: validateConfirm, trigger: "blur" }
  ]
};

onMounted(() => {
  infoForm.name = userStore.nickname || userStore.username || "";
  infoForm.phone = userStore.phone || "";
  avatarPreviewUrl.value = userStore.avatar
    ? `/api/file/image?name=${encodeURIComponent(userStore.avatar)}`
    : "";
});

// 保存信息
const saveInfo = async () => {
  const valid = await infoFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  savingInfo.value = true;
  try {
    let avatar = userStore.avatar;
    if (avatarPending.value) {
      const up: any = await uploadUserAvatar(avatarPending.value);
      if (up?.success && up.data) {
        avatar = up.data;
      } else {
        message(up?.msg || "头像上传失败", { type: "warning" });
        return;
      }
    }
    const r: any = await updateProfile({
      name: infoForm.name,
      phone: infoForm.phone,
      ...(avatar !== userStore.avatar ? { avatar } : {})
    });
    if (r?.success) {
      avatarPending.value = null;
      userStore.SET_NICKNAME(infoForm.name);
      userStore.SET_USERNAME(infoForm.name);
      if (avatar !== userStore.avatar) {
        userStore.SET_AVATAR(avatar);
        avatarPreviewUrl.value = `/api/file/image?name=${encodeURIComponent(avatar)}`;
        avatarList.value = [];
      }
      message("保存成功", { type: "success" });
    } else {
      message(r?.msg || "保存失败", { type: "warning" });
    }
  } finally {
    savingInfo.value = false;
  }
};

// 修改密码
const savePwd = async () => {
  const valid = await pwdFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  savingPwd.value = true;
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
    } else {
      message(r?.msg || "修改失败", { type: "warning" });
    }
  } finally {
    savingPwd.value = false;
  }
};
</script>

<template>
  <div class="profile-page">
    <div class="profile-card">
      <div class="profile-card-header">
        <h2>个人中心</h2>
      </div>

      <!-- 基本信息 -->
      <div class="profile-section">
        <div class="section-title">基本信息</div>

        <!-- 头像 -->
        <div class="avatar-row">
          <el-upload
            ref="avatarUploadRef"
            v-model:file-list="avatarList"
            :limit="1"
            :auto-upload="false"
            :on-change="handleAvatarChange"
            :on-remove="handleAvatarRemove"
            :on-exceed="() => message('最多1张头像', { type: 'warning' })"
            accept="image/*"
            :show-file-list="false"
          >
            <div class="avatar-wrapper">
              <el-avatar :size="80" :src="avatarPreviewUrl || undefined">
                <span class="avatar-placeholder">{{
                  (userStore.nickname || userStore.username || "?").charAt(0)
                }}</span>
              </el-avatar>
              <div class="avatar-mask">
                <span>更换头像</span>
              </div>
            </div>
          </el-upload>
          <span class="avatar-hint"
            >点击头像更换，支持 jpg/png/gif/webp，不超过 5MB</span
          >
        </div>
        <el-form
          ref="infoFormRef"
          :model="infoForm"
          :rules="infoRules"
          label-width="90px"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="账号">
                <el-input :model-value="userStore.username" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
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
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="infoForm.name" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号">
                <el-input v-model="infoForm.phone" placeholder="请输入手机号" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-button type="primary" :loading="savingInfo" @click="saveInfo">
              保存
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 修改密码 -->
      <div class="profile-section">
        <div class="section-title">修改密码</div>
        <el-form
          ref="pwdFormRef"
          :model="pwdForm"
          :rules="pwdRules"
          label-width="90px"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="旧密码" prop="oldPassword">
                <el-input
                  v-model="pwdForm.oldPassword"
                  type="password"
                  show-password
                  placeholder="请输入旧密码"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="pwdForm.newPassword"
                  type="password"
                  show-password
                  placeholder="请输入新密码"
                />
                <div class="pwd-hint">
                  密码要求：8-18位，须包含数字、字母、符号中至少两种
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="pwdForm.confirmPassword"
                  type="password"
                  show-password
                  placeholder="请再次输入新密码"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-button type="primary" :loading="savingPwd" @click="savePwd">
              修改密码
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-page {
  max-width: 900px;
  padding: 20px;
  margin: 0 auto;
}

.profile-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 6%);

  &-header {
    padding: 20px 24px 0;
    margin-bottom: 24px;
    border-bottom: 1px solid #ebeef5;

    h2 {
      margin: 0 0 20px;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.profile-section {
  padding: 0 24px 24px;
  margin-bottom: 8px;

  .section-title {
    padding-left: 10px;
    margin-bottom: 20px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    border-left: 3px solid #409eff;
  }
}

.avatar-row {
  display: flex;
  gap: 20px;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
}

.avatar-wrapper {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid #e4e7ed;
  border-radius: 50%;
  transition: border-color 0.2s;

  &:hover {
    border-color: #409eff;

    .avatar-mask {
      opacity: 1;
    }
  }
}

.avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #fff;
  background: rgb(0 0 0 / 40%);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-placeholder {
  font-size: 28px;
}

.avatar-hint {
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

.pwd-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}
</style>
