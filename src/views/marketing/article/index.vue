<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import {
  getArticleList,
  getArticleDetail,
  publishArticle,
  deleteArticle
} from "@/api/marketing";
import ArticleFormDialog from "./components/ArticleFormDialog.vue";
import CategoryManageDialog from "./components/CategoryManageDialog.vue";

defineOptions({ name: "MktArticle" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "", isPublished: "" as any });

const contentTypeMap: Record<number, string> = {
  1: "图片",
  2: "视频",
  3: "富文本"
};

// ---- 文章表单对话框 ----
const formDialogVisible = ref(false);
const isEdit = ref(false);
const currentFormData = ref(null);
const formDialogRef = ref();

// ---- 分类管理对话框 ----
const categoryDialogVisible = ref(false);
const categoryDialogRef = ref();

const load = async () => {
  loading.value = true;
  try {
    const r = await getArticleList({
      page: page.value,
      size: size.value,
      keyword: query.keyword || undefined,
      isPublished: query.isPublished !== "" ? query.isPublished : undefined
    });
    if (r?.success && r.data) {
      tableData.value = r.data.list || [];
      total.value = r.data.total || 0;
    } else {
      tableData.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error("加载文章列表失败:", error);
    message("加载失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.keyword = "";
  query.isPublished = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const openAdd = () => {
  isEdit.value = false;
  currentFormData.value = null;
  formDialogVisible.value = true;
};

const openEdit = async (row: any) => {
  isEdit.value = true;
  formDialogVisible.value = true;
  currentFormData.value = null;
  loading.value = true;
  try {
    const r = await getArticleDetail(row.id);
    if (r?.success && r.data) {
      currentFormData.value = {
        articleId: r.data.id,
        categoryId: r.data.category_id,
        title: r.data.title,
        content: r.data.content || "",
        coverImage: r.data.cover_image,
        contentType: r.data.content_type,
        isPublished: r.data.is_published,
        imageUrls: r.data.image_urls || "",
        videoUrl: r.data.video_url || ""
      };
    } else {
      message(r?.msg || "获取文章详情失败", { type: "warning" });
      formDialogVisible.value = false;
    }
  } catch {
    message("获取文章详情失败", { type: "error" });
    formDialogVisible.value = false;
  } finally {
    loading.value = false;
  }
};

const togglePublish = async (id: number, isPublished: number) => {
  try {
    const confirmText = isPublished ? "确认下架该文章？" : "确认发布该文章？";
    await ElMessageBox.confirm(confirmText, "提示");
    const r = await publishArticle({
      articleId: id,
      isPublished: isPublished ? 0 : 1
    });
    if (r?.success) {
      message("操作成功", { type: "success" });
      await load();
    } else {
      message(r?.msg || "失败", { type: "warning" });
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("切换状态失败:", error);
      message("操作失败", { type: "error" });
    }
  }
};

const doDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除该文章？", "提示");
    const r = await deleteArticle(id);
    if (r?.success) {
      message("已删除", { type: "success" });
      await load();
    } else {
      message(r?.msg || "失败", { type: "warning" });
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      message("删除失败", { type: "error" });
    }
  }
};

onMounted(() => {
  load();
});
</script>

<template>
  <div class="page-container">
    <!-- 搜索/筛选区 -->
    <div class="page-header">
      <el-form :model="query" inline class="page-search">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="标题/内容"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.isPublished"
            clearable
            placeholder="全部"
            style="width: 100px"
          >
            <el-option label="已发布" :value="1" />
            <el-option label="草稿" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">新增文章</el-button>
          <el-button @click="categoryDialogVisible = true">分类管理</el-button>
        </div>
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column
          prop="title"
          label="标题"
          show-overflow-tooltip
          min-width="160"
        />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            <span>{{ row.category_name || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag>{{ contentTypeMap[row.content_type] || "富文本" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_published ? 'success' : 'info'">
              {{ row.is_published ? "已发布" : "草稿" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">
              编辑
            </el-button>
            <el-button
              link
              :type="row.is_published ? 'warning' : 'success'"
              @click="togglePublish(row.id, row.is_published)"
            >
              {{ row.is_published ? "下架" : "发布" }}
            </el-button>
            <el-button link type="danger" @click="doDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页区 -->
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination"
      @size-change="onSizeChange"
      @current-change="load"
    />

    <!-- 文章表单对话框 -->
    <ArticleFormDialog
      ref="formDialogRef"
      v-model:visible="formDialogVisible"
      :is-edit="isEdit"
      :form-data="currentFormData"
      @success="load"
    />

    <!-- 分类管理对话框 -->
    <CategoryManageDialog
      ref="categoryDialogRef"
      v-model:visible="categoryDialogVisible"
      @success="load"
    />
  </div>
</template>
