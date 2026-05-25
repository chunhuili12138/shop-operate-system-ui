<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { message } from "@/utils/message";
import type { FormInstance, FormRules } from "element-plus";
import {
  addCustomer,
  updateCustomer,
  type CustomerFormParams
} from "@/api/customer";
import { uploadUserAvatar } from "@/api/user";
import { getDictData } from "@/api/system";
import EpPlus from "~icons/ep/plus";

const props = defineProps<{
  visible: boolean;
  mode: "add" | "edit";
  data?: CustomerFormParams | null;
  shopId: number;
}>();

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "submit"): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const sourceOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);
const tagOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);

const form = reactive<CustomerFormParams & { source?: string }>({
  customersId: null,
  nickname: "",
  phone: "",
  gender: null,
  birthday: "",
  remark: "",
  tags: "",
  source: "offline"
});

const tagList = ref<string[]>([]);

// ---- 头像 ----
const avatarUploadRef = ref();
const avatarPending = ref<File | null>(null);
const avatarList = ref<any[]>([]);
const avatarUrl = ref("");

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
};

const handleAvatarRemove = () => {
  avatarPending.value = null;
  avatarList.value = [];
  avatarUrl.value = "";
};

const rules: FormRules = {
  nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号格式",
      trigger: "blur"
    }
  ]
};

const loadDicts = async () => {
  const [sourceR, tagR] = await Promise.all([
    getDictData({ dictCode: "customer_source" }),
    getDictData({ dictCode: "customer_tag", shopId: props.shopId })
  ]);
  if (sourceR?.success && Array.isArray(sourceR.data))
    sourceOptions.value = sourceR.data;
  if (tagR?.success && Array.isArray(tagR.data)) tagOptions.value = tagR.data;
};

const reloadTags = async () => {
  const r = await getDictData({
    dictCode: "customer_tag",
    shopId: props.shopId
  } as any);
  if (r?.success && Array.isArray(r.data)) tagOptions.value = r.data;
};

// 首次挂载加载字典
loadDicts();

watch(
  () => props.visible,
  v => {
    if (v) {
      reloadTags();
      if (props.mode === "edit" && props.data) {
        Object.assign(form, { source: "offline", ...props.data });
        tagList.value = props.data.tags
          ? props.data.tags.split(",").filter(t => t.trim())
          : [];
        avatarUrl.value = props.data.avatar_url || "";
        avatarList.value = avatarUrl.value
          ? [
              {
                name: avatarUrl.value,
                url: `/api/file/image?name=${encodeURIComponent(avatarUrl.value)}`
              }
            ]
          : [];
      } else {
        Object.assign(form, {
          customersId: null,
          nickname: "",
          phone: "",
          gender: null,
          birthday: "",
          remark: "",
          tags: "",
          source: "offline"
        });
        tagList.value = [];
        avatarUrl.value = "";
        avatarList.value = [];
        avatarPending.value = null;
      }
      formRef.value?.clearValidate();
    }
  }
);

const handleClose = () => emit("update:visible", false);

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    let av = avatarUrl.value;
    if (avatarPending.value) {
      const up: any = await uploadUserAvatar(avatarPending.value);
      if (up?.success && up.data) av = up.data;
      else {
        message(up?.msg || "头像上传失败", { type: "warning" });
        return;
      }
    }
    const submitData = {
      ...form,
      tags: tagList.value.join(","),
      avatarUrl: av || undefined
    } as CustomerFormParams;
    const api = props.mode === "add" ? addCustomer : updateCustomer;
    const r = await api(submitData);
    if (r?.success) {
      avatarPending.value = null;
      message(props.mode === "add" ? "新增成功" : "编辑成功", {
        type: "success"
      });
      emit("update:visible", false);
      emit("submit");
    } else {
      message(r?.msg || "操作失败", { type: "warning" });
    }
  } finally {
    loading.value = false;
  }
};

defineExpose({ reloadTags });
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="mode === 'add' ? '新增顾客' : '编辑顾客'"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="头像">
        <el-upload
          ref="avatarUploadRef"
          v-model:file-list="avatarList"
          list-type="picture-card"
          :limit="1"
          :auto-upload="false"
          :on-change="handleAvatarChange"
          :on-remove="handleAvatarRemove"
          :on-exceed="() => message('最多1张头像', { type: 'warning' })"
          :class="{ hideUploadBtn: avatarList.length >= 1 }"
          accept="image/*"
        >
          <EpPlus />
        </el-upload>
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input
          v-model="form.nickname"
          placeholder="请输入昵称"
          maxlength="50"
        />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input
          v-model="form.phone"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </el-form-item>
      <el-form-item label="性别">
        <el-select
          v-model="form.gender"
          clearable
          placeholder="请选择"
          style="width: 100%"
        >
          <el-option label="男" :value="1" />
          <el-option label="女" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源">
        <el-select
          v-model="form.source"
          placeholder="请选择"
          style="width: 100%"
        >
          <el-option
            v-for="s in sourceOptions"
            :key="s.dict_key"
            :label="s.dict_value"
            :value="s.dict_label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="生日">
        <el-date-picker
          v-model="form.birthday"
          type="date"
          placeholder="请选择生日"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="标签">
        <el-select
          v-model="tagList"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请选择或输入标签"
          style="width: 100%"
        >
          <el-option
            v-for="t in tagOptions"
            :key="t.dict_key"
            :label="t.dict_value"
            :value="t.dict_value"
          />
        </el-select>
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
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ mode === "add" ? "保存" : "更新" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.hideUploadBtn .el-upload--picture-card) {
  display: none;
}
</style>
