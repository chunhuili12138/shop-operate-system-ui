<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";
import {
  addArticle,
  updateArticle,
  getArticleCategories
} from "@/api/marketing";

const props = defineProps<{
  visible: boolean;
  isEdit: boolean;
  formData?: any;
}>();

const emit = defineEmits(["update:visible", "success"]);

const formRef = ref<FormInstance>();
const form = reactive({
  articleId: null as number | null,
  categoryId: "",
  title: "",
  content: "",
  coverImage: "",
  contentType: 3
});

const cats = ref<Array<{ id: string; name: string }>>([]);

// 加载文章分类
const loadCategories = async () => {
  const r = await getArticleCategories();
  if (r?.success) {
    cats.value = r.data || [];
  }
};

// 监听 props.formData 变化，自动同步表单数据
watch(
  () => props.formData,
  newData => {
    if (newData) {
      Object.assign(form, newData);
    } else {
      // 重置表单
      Object.assign(form, {
        articleId: null,
        categoryId: "",
        title: "",
        content: "",
        coverImage: "",
        contentType: 3
      });
    }
  },
  { immediate: true }
);

// 监听 visible 变化，打开时加载分类
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      loadCategories();
    }
  }
);

const save = async () => {
  const r = props.isEdit ? await updateArticle(form) : await addArticle(form);
  if (r?.success) {
    message("保存成功", { type: "success" });
    emit("update:visible", false);
    emit("success");
  } else {
    message(r?.msg || "失败", { type: "warning" });
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
      width="600px"
      class="dialog-sm"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form ref="formRef" :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="请选择分类">
            <el-option
              v-for="c in cats"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="封面">
          <el-input v-model="form.coverImage" placeholder="请输入图片路径" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入文章内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
