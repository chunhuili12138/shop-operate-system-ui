<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";
import {
  addArticle,
  updateArticle,
  getArticleCategories,
  uploadArticleImage
} from "@/api/marketing";
import RichTextEditor from "@/components/RichTextEditor/index.vue";
import EpPlus from "~icons/ep/plus";

const props = defineProps<{
  visible: boolean;
  isEdit: boolean;
  formData?: any;
}>();

const emit = defineEmits(["update:visible", "success"]);

const formRef = ref<FormInstance>();
const uploadRef = ref();
const pendingFile = ref<File | null>(null);
const fileList = ref<any[]>([]);
const saving = ref(false);

const form = reactive({
  articleId: null as number | null,
  categoryId: "",
  title: "",
  content: "",
  coverImage: "",
  contentType: 3,
  isPublished: 1
});

const cats = ref<Array<{ id: string; name: string }>>([]);

const contentTypeMap: Record<number, string> = {
  1: "图片",
  2: "视频",
  3: "富文本"
};

const loadCategories = async () => {
  const r = await getArticleCategories();
  if (r?.success) {
    cats.value = r.data || [];
  }
};

watch(
  () => props.formData,
  newData => {
    if (newData) {
      Object.assign(
        form,
        {
          articleId: null,
          categoryId: "",
          title: "",
          content: "",
          coverImage: "",
          contentType: 3,
          isPublished: 1
        },
        newData
      );
      if (newData.coverImage) {
        fileList.value = [
          {
            name: newData.coverImage,
            url: `/api/file/image?name=${encodeURIComponent(newData.coverImage)}`
          }
        ];
      } else {
        fileList.value = [];
      }
    } else {
      Object.assign(form, {
        articleId: null,
        categoryId: "",
        title: "",
        content: "",
        coverImage: "",
        contentType: 3,
        isPublished: 1
      });
      fileList.value = [];
      pendingFile.value = null;
    }
  },
  { immediate: true }
);

watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      loadCategories();
    }
  }
);

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
  const isLt5M = raw.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message("图片大小不能超过 5MB", { type: "warning" });
    uploadRef.value?.clearFiles();
    return;
  }
  pendingFile.value = raw;
  fileList.value = uploadFiles;
};

const handleRemove = () => {
  pendingFile.value = null;
  fileList.value = [];
  form.coverImage = "";
};

const handleExceed = () => {
  message("最多只能上传1张图片", { type: "warning" });
};

const save = async () => {
  if (!form.title?.trim()) {
    message("请输入文章标题", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    let coverImage = form.coverImage;
    if (pendingFile.value) {
      const up: any = await uploadArticleImage(pendingFile.value);
      if (up?.success && up.data) {
        coverImage = up.data;
      } else {
        message(up?.msg || "图片上传失败", { type: "warning" });
        return;
      }
    }
    const data = {
      ...form,
      coverImage
    };
    const r = props.isEdit ? await updateArticle(data) : await addArticle(data);
    if (r?.success) {
      pendingFile.value = null;
      message("保存成功", { type: "success" });
      emit("update:visible", false);
      emit("success");
    } else {
      message(r?.msg || "失败", { type: "warning" });
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
  <div>
    <el-dialog
      :model-value="visible"
      :title="isEdit ? '编辑文章' : '新增文章'"
      width="860px"
      class="dialog-lg"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form ref="formRef" :model="form" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select
                v-model="form.categoryId"
                placeholder="请选择分类"
                clearable
              >
                <el-option
                  v-for="c in cats"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内容类型">
              <el-select v-model="form.contentType" placeholder="内容类型">
                <el-option label="富文本" :value="3" />
                <el-option label="图片" :value="1" />
                <el-option label="视频" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="封面图">
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
        <el-form-item label="状态">
          <el-radio-group v-model="form.isPublished">
            <el-radio :value="1">发布</el-radio>
            <el-radio :value="0">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="内容" required>
          <RichTextEditor v-model="form.content" :height="350" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
:deep(.hideUploadBtn .el-upload--picture-card) {
  display: none;
}
</style>
