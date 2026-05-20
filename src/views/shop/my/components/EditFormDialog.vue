<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { message } from "@/utils/message";
import { updateMyShop, uploadShopPhoto } from "@/api/shop";
import EpPlus from "~icons/ep/plus";

interface Props {
  modelValue?: boolean;
  shopData?: any;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  shopData: null
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = ref(props.modelValue);
const saving = ref(false);
const uploadRef = ref();
const pendingFile = ref<File | null>(null);
const fileList = ref<any[]>([]);

const editForm = reactive({
  name: "",
  address: "",
  contactPhone: "",
  maxCapacity: null as number | null,
  description: "",
  signPhoto: ""
});

// 监听modelValue变化
watch(
  () => props.modelValue,
  val => {
    dialogVisible.value = val;
    if (val) {
      openEdit();
    }
  }
);

// 监听dialogVisible变化
watch(dialogVisible, val => {
  emit("update:modelValue", val);
});

const openEdit = () => {
  if (!props.shopData) return;

  editForm.name = props.shopData.name || "";
  editForm.address = props.shopData.address || "";
  editForm.contactPhone = props.shopData.contact_phone || "";
  editForm.maxCapacity = props.shopData.max_capacity ?? null;
  editForm.description = props.shopData.description || "";
  editForm.signPhoto = props.shopData.sign_photo || "";
  pendingFile.value = null;

  // 如果有原图，设置fileList用于显示预览
  if (props.shopData.sign_photo) {
    fileList.value = [
      {
        name: props.shopData.sign_photo,
        url: `/api/file/image?name=${encodeURIComponent(props.shopData.sign_photo)}`
      }
    ];
  } else {
    fileList.value = [];
  }
};

const handleChange = (uploadFile: any, uploadFiles: any[]) => {
  const raw = uploadFile.raw as File;
  if (!raw) return;
  if (
    !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(raw.type)
  ) {
    message("仅支持 jpg/png/gif/webp 格式", { type: "warning" });
    uploadRef.value?.clearFiles();
    return;
  }
  // 限制图片大小不超过5MB
  const isLt5M = raw.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message("图片大小不能超过 5MB", { type: "warning" });
    uploadRef.value?.clearFiles();
    return;
  }
  pendingFile.value = raw;
  fileList.value = uploadFiles;
};

// 处理删除图片
const handleRemove = () => {
  pendingFile.value = null;
  fileList.value = [];
  editForm.signPhoto = "";
};

// 处理超出限制
const handleExceed = () => {
  message("最多只能上传1张图片", { type: "warning" });
};

const doEdit = async () => {
  // 表单验证
  if (!editForm.name?.trim()) {
    message("请输入店铺名称", { type: "warning" });
    return;
  }
  if (!editForm.contactPhone?.trim()) {
    message("请输入联系电话", { type: "warning" });
    return;
  }
  // 简单的手机号格式验证（可选，根据实际情况调整）
  const phoneReg = /^1[3-9]\d{9}$/;
  if (editForm.contactPhone && !phoneReg.test(editForm.contactPhone)) {
    message("请输入正确的手机号码", { type: "warning" });
    return;
  }

  saving.value = true;
  try {
    let signPhoto: string | undefined = undefined;

    // 只有当用户上传了新图片时，才上传并更新signPhoto
    if (pendingFile.value) {
      const up: any = await uploadShopPhoto(pendingFile.value);
      if (up?.success && up.data) {
        signPhoto = up.data;
      } else {
        message(up?.msg || "图片上传失败", { type: "warning" });
        return;
      }
    }
    // 如果没有上传新图片,signPhoto保持undefined,后端会保留原图

    const r: any = await updateMyShop({
      name: editForm.name,
      address: editForm.address,
      contactPhone: editForm.contactPhone,
      maxCapacity: editForm.maxCapacity ?? undefined,
      description: editForm.description,
      signPhoto // 只有上传了新图片才会传递此字段
    });
    if (r?.success) {
      pendingFile.value = null;
      message("保存成功", { type: "success" });
      dialogVisible.value = false;
      emit("success");
    } else {
      message(r?.msg || "保存失败", { type: "warning" });
    }
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    title="编辑店铺信息"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="val => (dialogVisible = val)"
  >
    <el-form :model="editForm" label-width="90px">
      <el-form-item label="店铺名称">
        <el-input v-model="editForm.name" placeholder="请输入店铺名称" />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input
          v-model="editForm.contactPhone"
          placeholder="请输入联系电话"
        />
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="editForm.address" placeholder="请输入地址" />
      </el-form-item>
      <el-form-item label="最大容量">
        <el-input-number
          v-model="editForm.maxCapacity"
          :min="1"
          :max="999"
          placeholder="最大容量"
        />
      </el-form-item>
      <el-form-item label="招牌照片">
        <el-upload
          ref="uploadRef"
          v-model:file-list="fileList"
          list-type="picture-card"
          :limit="1"
          :auto-upload="false"
          :on-change="handleChange"
          :on-remove="handleRemove"
          :on-exceed="handleExceed"
          :class="{ hideUploadBtn: fileList.length >= 1 }"
          accept="image/*"
        >
          <EpPlus />
        </el-upload>
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="editForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="doEdit"
        >保存</el-button
      >
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
// 隐藏达到数量限制时的上传按钮占位符
:deep(.hideUploadBtn .el-upload--picture-card) {
  display: none;
}
</style>
