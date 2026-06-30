<script setup lang="ts">
import { ref, computed } from "vue";
import { fileUrl } from "@/utils/file";
import { getArticleDetail } from "@/api/marketing";
import { message } from "@/utils/message";

const props = defineProps<{
  visible: boolean;
  articleId: number | null;
}>();

const emit = defineEmits(["update:visible"]);

const loading = ref(false);
const detail = ref<any>(null);
const carouselIndex = ref(0);

const images = computed(() => {
  if (!detail.value?.image_urls) return [];
  return String(detail.value.image_urls)
    .split(",")
    .filter(Boolean)
    .map(
      (url: string) => fileUrl(url.trim())
    );
});

const videoUrl = computed(() => {
  if (!detail.value?.video_url) return "";
  return fileUrl(detail.value.video_url);
});

const coverUrl = computed(() => {
  if (!detail.value?.cover_image) return "";
  return fileUrl(detail.value.cover_image);
});

const contentTypeLabel = computed(() => {
  const map: Record<number, string> = { 1: "图片", 2: "视频", 3: "富文本" };
  return map[detail.value?.content_type] || "富文本";
});

const hasContent = computed(() => {
  if (!detail.value) return false;
  const ct = detail.value.content_type;
  if (ct === 1) return images.value.length > 0;
  if (ct === 2) return !!videoUrl.value;
  if (ct === 3) return !!detail.value.content;
  return false;
});

const load = async () => {
  if (!props.articleId) return;
  carouselIndex.value = 0;
  loading.value = true;
  try {
    const r: any = await getArticleDetail(props.articleId);
    if (r?.success) {
      detail.value = r.data;
    } else {
      message(r?.msg || "加载失败", { type: "warning" });
    }
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  emit("update:visible", false);
};

defineExpose({ load });
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="detail?.title || '文章预览'"
    width="880px"
    :close-on-click-modal="false"
    @close="handleClose"
    @opened="load"
  >
    <div v-loading="loading" class="preview-body">
      <template v-if="detail">
        <!-- 元信息 -->
        <div class="preview-meta">
          <span class="preview-meta-item">
            <span class="meta-label">分类</span>
            <span class="meta-value">{{ detail.category_name || "-" }}</span>
          </span>
          <span class="preview-meta-divider">|</span>
          <span class="preview-meta-item">
            <span class="meta-label">类型</span>
            <el-tag size="small" effect="plain">{{ contentTypeLabel }}</el-tag>
          </span>
          <span class="preview-meta-divider">|</span>
          <span class="preview-meta-item">
            <span class="meta-label">时间</span>
            <span class="meta-value">{{ detail.created_at || "-" }}</span>
          </span>
        </div>

        <!-- 封面图 -->
        <div v-if="coverUrl" class="preview-cover">
          <img :src="coverUrl" alt="封面图" />
        </div>

        <!-- 富文本 -->
        <div
          v-if="detail.content_type === 3 && detail.content"
          class="preview-richtext"
          v-html="detail.content"
        />

        <!-- 图片集：轮播 -->
        <div
          v-if="detail.content_type === 1 && images.length"
          class="preview-carousel-wrapper"
        >
          <el-carousel
            v-model="carouselIndex"
            :interval="4000"
            arrow="always"
            indicator-position="outside"
            height="460px"
          >
            <el-carousel-item v-for="(url, idx) in images" :key="idx">
              <div class="carousel-slide">
                <img :src="url" :alt="'图片' + (idx + 1)" />
                <span class="carousel-counter"
                  >{{ idx + 1 }} / {{ images.length }}</span
                >
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>

        <!-- 视频 -->
        <div v-if="detail.content_type === 2 && videoUrl" class="preview-video">
          <video :src="videoUrl" controls />
        </div>

        <!-- 空状态 -->
        <div v-if="!hasContent && !coverUrl" class="preview-empty">
          <el-empty description="暂无内容" />
        </div>
      </template>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.preview-body {
  min-height: 200px;
  max-height: 70vh;
  overflow-y: auto;
}

// ---- 元信息 ----
.preview-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 13px;
  background: linear-gradient(135deg, #f8f9fc 0%, #f0f2f5 100%);
  border-radius: 8px;

  &-item {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  &-divider {
    font-size: 12px;
    color: #dcdfe6;
  }
}

.meta-label {
  font-size: 12px;
  color: #909399;
}

.meta-value {
  color: #303133;
}

// ---- 封面图 ----
.preview-cover {
  margin-bottom: 20px;
  text-align: center;

  img {
    max-width: 100%;
    max-height: 280px;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgb(0 0 0 / 8%);
  }
}

// ---- 富文本 ----
.preview-richtext {
  padding: 0 4px;
  font-size: 15px;
  line-height: 1.85;
  color: #333;
  word-break: break-word;

  :deep(p) {
    margin: 0 0 12px;
    text-indent: 2em;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(img) {
    display: block;
    max-width: 80%;
    margin: 16px auto;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
  }

  :deep(video) {
    display: block;
    max-width: 100%;
    margin: 16px auto;
    outline: none;
    border-radius: 6px;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 20px 0 12px;
    line-height: 1.4;
  }

  :deep(blockquote) {
    padding: 8px 16px;
    margin: 12px 0;
    color: #606266;
    background: #f5f7fa;
    border-left: 3px solid #409eff;
    border-radius: 0 4px 4px 0;
  }

  :deep(table) {
    width: 100%;
    margin: 12px 0;
    border-collapse: collapse;

    th,
    td {
      padding: 8px 12px;
      border: 1px solid #ebeef5;
    }

    th {
      background: #f5f7fa;
    }
  }

  :deep(pre) {
    padding: 12px 16px;
    overflow-x: auto;
    font-size: 13px;
    background: #f5f7fa;
    border-radius: 6px;
  }
}

// ---- 轮播 ----
.preview-carousel-wrapper {
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 6%);

  :deep(.el-carousel__container) {
    background: #f5f7fa;
  }
}

.carousel-slide {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  img {
    display: block;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}

.carousel-counter {
  position: absolute;
  right: 16px;
  bottom: 12px;
  padding: 2px 10px;
  font-size: 12px;
  color: #fff;
  background: rgb(0 0 0 / 50%);
  border-radius: 12px;
}

// ---- 视频 ----
.preview-video {
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 6%);

  video {
    display: block;
    width: 100%;
    max-height: 480px;
    outline: none;
    background: #000;
  }
}

// ---- 空状态 ----
.preview-empty {
  padding: 60px 0;
}
</style>
