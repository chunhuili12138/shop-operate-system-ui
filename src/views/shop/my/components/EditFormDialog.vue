<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { message } from "@/utils/message";
import { fileUrl } from "@/utils/file";
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

const logoUploadRef = ref();
const pendingLogoFile = ref<File | null>(null);
const logoFileList = ref<any[]>([]);

const editForm = reactive({
  name: "",
  address: "",
  contactPhone: "",
  maxCapacity: null as number | null,
  description: "",
  signPhoto: "",
  logo: ""
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
  editForm.logo = props.shopData.logo || "";
  pendingFile.value = null;
  pendingLogoFile.value = null;

  if (props.shopData.sign_photo) {
    fileList.value = [
      {
        name: props.shopData.sign_photo,
        url: fileUrl(props.shopData.sign_photo)
      }
    ];
  } else {
    fileList.value = [];
  }

  if (props.shopData.logo) {
    logoFileList.value = [
      {
        name: props.shopData.logo,
        url: fileUrl(props.shopData.logo)
      }
    ];
  } else {
    logoFileList.value = [];
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

const handleLogoChange = (uploadFile: any, uploadFiles: any[]) => {
  const raw = uploadFile.raw as File;
  if (!raw) return;
  if (
    !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(raw.type)
  ) {
    message("仅支持 jpg/png/gif/webp 格式", { type: "warning" });
    logoUploadRef.value?.clearFiles();
    return;
  }
  if (raw.size / 1024 / 1024 > 5) {
    message("图片大小不能超过 5MB", { type: "warning" });
    logoUploadRef.value?.clearFiles();
    return;
  }
  // 检查分辨率
  const reader = new FileReader();
  reader.onload = (e: any) => {
    const img = new Image();
    img.onload = () => {
      if (img.width < 300 || img.height < 300) {
        message("Logo分辨率建议不低于300x300px，推荐400x400px以上正方形", {
          type: "warning"
        });
        logoUploadRef.value?.clearFiles();
        return;
      }
      pendingLogoFile.value = raw;
      logoFileList.value = uploadFiles;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(raw);
};

const handleLogoRemove = () => {
  pendingLogoFile.value = null;
  logoFileList.value = [];
  editForm.logo = "";
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
    let logo: string | undefined = undefined;

    if (pendingFile.value) {
      const up: any = await uploadShopPhoto(pendingFile.value);
      if (up?.success && up.data) {
        signPhoto = up.data;
      } else {
        message(up?.msg || "图片上传失败", { type: "warning" });
        return;
      }
    }

    // 上传 logo
    if (pendingLogoFile.value) {
      const up: any = await uploadShopPhoto(pendingLogoFile.value);
      if (up?.success && up.data) {
        logo = up.data;
      } else {
        message(up?.msg || "Logo上传失败", { type: "warning" });
        return;
      }
    }

    const r: any = await updateMyShop({
      name: editForm.name,
      address: editForm.address,
      contactPhone: editForm.contactPhone,
      maxCapacity: editForm.maxCapacity ?? undefined,
      description: editForm.description,
      signPhoto,
      logo
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
      <el-form-item label="店铺Logo">
        <el-upload
          ref="logoUploadRef"
          v-model:file-list="logoFileList"
          list-type="picture-card"
          :limit="1"
          :auto-upload="false"
          :on-change="handleLogoChange"
          :on-remove="handleLogoRemove"
          :on-exceed="handleExceed"
          :class="{ hideUploadBtn: logoFileList.length >= 1 }"
          accept="image/*"
        >
          <EpPlus />
        </el-upload>
        <div class="upload-tip">
          建议 400x400px 以上正方形，显示在太阳码中心（约 163px 区域）
        </div>
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
:deep(.hideUploadBtn .el-upload--picture-card) {
  display: none;
}

.upload-tip {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}
</style>
