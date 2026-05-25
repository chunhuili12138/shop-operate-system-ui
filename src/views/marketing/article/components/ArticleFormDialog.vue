<script setup lang="ts">
import { reactive, ref, watch, computed } from "vue";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";
import {
  addArticle,
  updateArticle,
  getArticleCategories,
  uploadArticleCover,
  uploadArticleContentImage,
  uploadArticleVideo
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
const saving = ref(false);

const form = reactive({
  articleId: null as number | null,
  categoryId: "",
  title: "",
  content: "",
  coverImage: "",
  contentType: 3,
  isPublished: 1,
  imageUrls: "",
  videoUrl: ""
});

const cats = ref<Array<{ id: string; name: string }>>([]);

// ---- 封面图上传 ----
const coverUploadRef = ref();
const coverPendingFile = ref<File | null>(null);
const coverFileList = ref<any[]>([]);

// ---- 内容图片上传（contentType=1） ----
const imagesUploadRef = ref();
const imageFiles = ref<File[]>([]);
const imageFileList = ref<any[]>([]);

// ---- 内容视频上传（contentType=2） ----
const videoUploadRef = ref();
const videoPendingFile = ref<File | null>(null);
const videoFileList = ref<any[]>([]);

const contentTypeLabel = computed(() => {
  const map: Record<number, string> = { 1: "图片", 2: "视频", 3: "富文本" };
  return map[form.contentType] || "富文本";
});

const loadCategories = async () => {
  const r = await getArticleCategories();
  if (r?.success) {
    cats.value = r.data || [];
  }
};

// ---- 重置所有上传状态 ----
const resetUploads = () => {
  coverPendingFile.value = null;
  coverFileList.value = [];
  imageFiles.value = [];
  imageFileList.value = [];
  videoPendingFile.value = null;
  videoFileList.value = [];
};

// ---- 监听 formData 变化，同步表单 ----
watch(
  () => props.formData,
  newData => {
    const defaults = {
      articleId: null,
      categoryId: "",
      title: "",
      content: "",
      coverImage: "",
      contentType: 3,
      isPublished: 1,
      imageUrls: "",
      videoUrl: ""
    };
    resetUploads();
    if (newData) {
      Object.assign(form, defaults, newData);
      // 封面图预览
      if (newData.coverImage) {
        coverFileList.value = [
          {
            name: newData.coverImage,
            url: `/api/file/image?name=${encodeURIComponent(newData.coverImage)}`
          }
        ];
      }
      // 图片类型：回显已有的图片
      if (newData.contentType === 1 && newData.imageUrls) {
        const urls = String(newData.imageUrls).split(",").filter(Boolean);
        imageFileList.value = urls.map((url: string) => ({
          name: url.trim(),
          url: `/api/file/image?name=${encodeURIComponent(url.trim())}`
        }));
      }
      // 视频类型：回显已有视频
      if (newData.contentType === 2 && newData.videoUrl) {
        videoFileList.value = [
          {
            name: newData.videoUrl,
            url: `/api/file/image?name=${encodeURIComponent(newData.videoUrl)}`
          }
        ];
      }
    } else {
      Object.assign(form, defaults);
    }
  },
  { immediate: true }
);

watch(
  () => props.visible,
  newVal => {
    if (newVal) loadCategories();
  }
);

// ---- 封面图上传处理 ----
const handleCoverChange = (uploadFile: any, uploadFiles: any[]) => {
  const raw = uploadFile.raw as File;
  if (!raw) return;
  if (
    !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(raw.type)
  ) {
    message("仅支持 jpg/png/gif/webp 格式", { type: "warning" });
    coverUploadRef.value?.clearFiles();
    return;
  }
  if (raw.size / 1024 / 1024 > 5) {
    message("图片大小不能超过 5MB", { type: "warning" });
    coverUploadRef.value?.clearFiles();
    return;
  }
  coverPendingFile.value = raw;
  coverFileList.value = uploadFiles;
};

const handleCoverRemove = () => {
  coverPendingFile.value = null;
  coverFileList.value = [];
  form.coverImage = "";
};

// ---- 内容图片上传处理（contentType=1） ----
const handleImageChange = (uploadFile: any, uploadFiles: any[]) => {
  const raw = uploadFile.raw as File;
  if (!raw) return;
  if (
    !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(raw.type)
  ) {
    message("仅支持 jpg/png/gif/webp 格式", { type: "warning" });
    return;
  }
  if (raw.size / 1024 / 1024 > 5) {
    message("单张图片不能超过 5MB", { type: "warning" });
    return;
  }
  imageFileList.value = uploadFiles;
};

const handleImageRemove = (_file: any, uploadFiles: any[]) => {
  imageFileList.value = uploadFiles;
};

// ---- 视频上传处理（contentType=2） ----
const handleVideoChange = (uploadFile: any, uploadFiles: any[]) => {
  const raw = uploadFile.raw as File;
  if (!raw) return;
  if (
    ![
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
      "video/x-matroska"
    ].includes(raw.type)
  ) {
    message("仅支持 mp4/mov/avi/webm/mkv 格式", { type: "warning" });
    videoUploadRef.value?.clearFiles();
    return;
  }
  if (raw.size / 1024 / 1024 > 100) {
    message("视频大小不能超过 100MB", { type: "warning" });
    videoUploadRef.value?.clearFiles();
    return;
  }
  videoPendingFile.value = raw;
  videoFileList.value = uploadFiles;
};

const handleVideoRemove = () => {
  videoPendingFile.value = null;
  videoFileList.value = [];
  form.videoUrl = "";
};

// ---- 保存 ----
const save = async () => {
  if (!form.title?.trim()) {
    message("请输入文章标题", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    let coverImage = form.coverImage;
    let imageUrls = form.imageUrls;
    let videoUrl = form.videoUrl;
    let content = form.content;

    // 上传封面图
    if (coverPendingFile.value) {
      const up: any = await uploadArticleCover(coverPendingFile.value);
      if (up?.success && up.data) coverImage = up.data;
      else {
        message(up?.msg || "封面上传失败", { type: "warning" });
        return;
      }
    }

    // 根据内容类型处理
    if (form.contentType === 1) {
      // 图片类型：上传新增的图片
      const newFiles = imageFileList.value.filter(f => f.raw instanceof File);
      if (newFiles.length > 0) {
        const uploadPromises = newFiles.map((f: any) =>
          uploadArticleContentImage(f.raw)
        );
        const results = await Promise.all(uploadPromises);
        const newPaths: string[] = [];
        for (const r of results) {
          if (r?.success && r.data) newPaths.push(r.data);
        }
        // 保留已有图片（没有 raw 的），合并新路径
        const existingPaths = imageFileList.value
          .filter((f: any) => !(f.raw instanceof File))
          .map((f: any) => f.name);
        imageUrls = [...existingPaths, ...newPaths].join(",");
      } else {
        // 没有新图片，保留原值
        imageUrls = form.imageUrls;
      }
    } else if (form.contentType === 2) {
      // 视频类型：上传视频
      if (videoPendingFile.value) {
        const up: any = await uploadArticleVideo(videoPendingFile.value);
        if (up?.success && up.data) videoUrl = up.data;
        else {
          message(up?.msg || "视频上传失败", { type: "warning" });
          return;
        }
      }
    }
    // contentType=3: content 已经是 HTML，不需要额外处理

    const data: any = {
      articleId: form.articleId,
      categoryId: form.categoryId,
      title: form.title,
      contentType: form.contentType,
      coverImage,
      isPublished: form.isPublished
    };

    if (form.contentType === 1) data.imageUrls = imageUrls;
    else if (form.contentType === 2) {
      data.videoUrl = videoUrl;
      data.content = videoUrl;
    } else data.content = content;

    const r = props.isEdit ? await updateArticle(data) : await addArticle(data);
    if (r?.success) {
      coverPendingFile.value = null;
      videoPendingFile.value = null;
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
      width="1100px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form ref="formRef" :model="form">
        <el-row :gutter="24">
          <!-- ========== 左侧：内容编辑区 ========== -->
          <el-col :span="15">
            <div class="content-panel">
              <div class="content-panel-header">
                <span class="content-panel-title"
                  >{{ contentTypeLabel }}内容</span
                >
                <span v-if="form.contentType === 1" class="content-panel-hint"
                  >可上传多张图片</span
                >
              </div>
              <div class="content-panel-body">
                <!-- 富文本 -->
                <RichTextEditor
                  v-if="form.contentType === 3"
                  v-model="form.content"
                  :height="420"
                  placeholder="请输入文章内容..."
                />
                <!-- 图片上传 -->
                <el-upload
                  v-if="form.contentType === 1"
                  ref="imagesUploadRef"
                  v-model:file-list="imageFileList"
                  list-type="picture-card"
                  multiple
                  :auto-upload="false"
                  :on-change="handleImageChange"
                  :on-remove="handleImageRemove"
                  accept="image/*"
                >
                  <EpPlus />
                  <template #tip>
                    <div class="el-upload__tip">
                      支持 jpg/png/gif/webp，单张不超过 5MB
                    </div>
                  </template>
                </el-upload>
                <!-- 视频上传 -->
                <div v-if="form.contentType === 2" class="video-upload-area">
                  <el-upload
                    ref="videoUploadRef"
                    v-model:file-list="videoFileList"
                    :limit="1"
                    :auto-upload="false"
                    :on-change="handleVideoChange"
                    :on-remove="handleVideoRemove"
                    :on-exceed="
                      () => message('只能上传1个视频', { type: 'warning' })
                    "
                    :class="{ hideVideoBtn: videoFileList.length >= 1 }"
                    accept="video/*"
                    drag
                  >
                    <div class="video-upload-placeholder">
                      <span class="video-upload-icon">+</span>
                      <span class="video-upload-text">点击或拖拽上传视频</span>
                    </div>
                  </el-upload>
                  <!-- 视频预览 -->
                  <div
                    v-if="form.videoUrl && !videoPendingFile"
                    class="video-preview"
                  >
                    <video
                      :src="`/api/file/image?name=${encodeURIComponent(form.videoUrl)}`"
                      controls
                      style="width: 100%; max-height: 260px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </el-col>

          <!-- ========== 右侧：表单字段 ========== -->
          <el-col :span="9">
            <div class="form-panel">
              <el-form-item label="标题" required>
                <el-input v-model="form.title" placeholder="请输入文章标题" />
              </el-form-item>
              <el-form-item label="分类">
                <el-select
                  v-model="form.categoryId"
                  placeholder="请选择分类"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="c in cats"
                    :key="c.id"
                    :label="c.name"
                    :value="c.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="内容类型">
                <el-select v-model="form.contentType" style="width: 100%">
                  <el-option label="富文本" :value="3" />
                  <el-option label="图片" :value="1" />
                  <el-option label="视频" :value="2" />
                </el-select>
              </el-form-item>
              <el-form-item label="封面图">
                <el-upload
                  ref="coverUploadRef"
                  v-model:file-list="coverFileList"
                  list-type="picture-card"
                  :limit="1"
                  :auto-upload="false"
                  :on-change="handleCoverChange"
                  :on-remove="handleCoverRemove"
                  :on-exceed="
                    () => message('最多1张封面图', { type: 'warning' })
                  "
                  :class="{ hideUploadBtn: coverFileList.length >= 1 }"
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
            </div>
          </el-col>
        </el-row>
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
.content-panel {
  min-height: 500px;
  border: 1px solid #ebeef5;
  border-radius: 6px;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #fafafa;
    border-bottom: 1px solid #ebeef5;
    border-radius: 6px 6px 0 0;
  }

  &-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  &-hint {
    font-size: 12px;
    color: #909399;
  }

  &-body {
    padding: 12px;
  }
}

.form-panel {
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
}

.video-upload-area {
  .video-upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 0;
    color: #8c939d;
  }

  .video-upload-icon {
    margin-bottom: 8px;
    font-size: 48px;
    line-height: 1;
    color: #c0c4cc;
  }

  .video-upload-text {
    font-size: 14px;
  }

  .video-preview {
    margin-top: 12px;
  }
}

:deep(.hideUploadBtn .el-upload--picture-card) {
  display: none;
}

:deep(.hideVideoBtn .el-upload-dragger) {
  display: none;
}
</style>
