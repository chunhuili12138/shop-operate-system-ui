<script setup lang="ts">
import {
  ref,
  watch,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount
} from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import Sortable from "sortablejs";
import {
  getArticleCategories,
  sortArticleCategories,
  addCategory,
  updateCategory,
  deleteCategory
} from "@/api/marketing";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits(["update:visible", "success"]);

const loading = ref(false);
const allCats = ref<any[]>([]);
const newCatName = ref("");
const adding = ref(false);

// 编辑状态
const editingId = ref<number | null>(null);
const editingName = ref("");

// 分类为系统分类和店铺分类
const systemCats = computed(() =>
  allCats.value.filter(c => c.shop_id === 0 || c.shop_id === "0")
);
const shopCats = computed(() =>
  allCats.value.filter(c => c.shop_id !== 0 && c.shop_id !== "0")
);

// sortablejs 实例
const sortableRef = ref<HTMLElement>();
let sortableInstance: Sortable | null = null;

const load = async () => {
  loading.value = true;
  try {
    const r: any = await getArticleCategories();
    if (r?.success) {
      allCats.value = r.data || [];
    }
  } finally {
    loading.value = false;
  }
};

const initSortable = () => {
  if (!sortableRef.value) return;
  if (sortableInstance) sortableInstance.destroy();
  sortableInstance = Sortable.create(sortableRef.value, {
    animation: 200,
    handle: ".drag-handle",
    ghostClass: "sortable-ghost",
    onEnd: async evt => {
      const { oldIndex, newIndex } = evt;
      if (
        oldIndex === undefined ||
        newIndex === undefined ||
        oldIndex === newIndex
      )
        return;
      const moved = shopCats.value.splice(oldIndex, 1)[0];
      shopCats.value.splice(newIndex, 0, moved);
      await saveSort();
    }
  });
};

const saveSort = async () => {
  const items = shopCats.value.map((c, i) => ({ id: Number(c.id), sort: i }));
  const r: any = await sortArticleCategories(items);
  if (!r?.success) {
    message(r?.msg || "排序保存失败", { type: "warning" });
    await load();
    nextTick(initSortable);
  }
};

// 新增
const doAdd = async () => {
  const name = newCatName.value.trim();
  if (!name) return;
  adding.value = true;
  try {
    const r: any = await addCategory(name);
    if (r?.success) {
      newCatName.value = "";
      await load();
      nextTick(initSortable);
      emit("success");
    } else {
      message(r?.msg || "添加失败", { type: "warning" });
    }
  } finally {
    adding.value = false;
  }
};

// 开始编辑
const startEdit = (cat: any) => {
  editingId.value = cat.id;
  editingName.value = cat.name;
};

// 保存编辑
const saveEdit = async (cat: any) => {
  const name = editingName.value.trim();
  if (!name || name === cat.name) {
    editingId.value = null;
    return;
  }
  const r: any = await updateCategory(cat.id, name);
  if (r?.success) {
    cat.name = name;
    editingId.value = null;
    emit("success");
  } else {
    message(r?.msg || "修改失败", { type: "warning" });
  }
};

// 取消编辑
const cancelEdit = () => {
  editingId.value = null;
};

// 删除
const doDelete = async (cat: any) => {
  try {
    await ElMessageBox.confirm(`确认删除分类"${cat.name}"？`, "提示", {
      type: "warning"
    });
    const r: any = await deleteCategory(cat.id);
    if (r?.success) {
      await load();
      nextTick(initSortable);
      emit("success");
    } else {
      message(r?.msg || "删除失败", { type: "warning" });
    }
  } catch {
    // 取消
  }
};

const handleClose = () => {
  emit("update:visible", false);
};

watch(
  () => props.visible,
  async val => {
    if (val) {
      await load();
      await nextTick();
      initSortable();
    }
  }
);

onBeforeUnmount(() => {
  if (sortableInstance) sortableInstance.destroy();
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="文章分类管理"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-loading="loading">
      <!-- 系统分类 -->
      <div class="cat-section">
        <div class="cat-section-title">系统分类</div>
        <div class="system-tags">
          <el-tag
            v-for="cat in systemCats"
            :key="cat.id"
            type="info"
            class="system-tag"
          >
            {{ cat.name }}
          </el-tag>
          <span v-if="systemCats.length === 0" class="empty-hint">暂无</span>
        </div>
      </div>

      <!-- 店铺分类 -->
      <div class="cat-section">
        <div class="cat-section-title">
          店铺分类
          <span class="cat-section-hint">拖拽 ≡ 调整排序</span>
        </div>
        <div v-if="shopCats.length === 0" class="empty-hint">
          暂无店铺分类，请在下方添加
        </div>
        <ul ref="sortableRef" class="sort-list">
          <li v-for="cat in shopCats" :key="cat.id" class="sort-item">
            <span class="drag-handle" title="拖拽排序">≡</span>
            <!-- 编辑态 -->
            <template v-if="editingId === cat.id">
              <el-input
                v-model="editingName"
                size="small"
                class="edit-input"
                @keyup.enter="saveEdit(cat)"
                @keyup.escape="cancelEdit"
              />
              <el-button link type="primary" size="small" @click="saveEdit(cat)"
                >保存</el-button
              >
              <el-button link size="small" @click="cancelEdit">取消</el-button>
            </template>
            <!-- 展示态 -->
            <template v-else>
              <span class="sort-item-name">{{ cat.name }}</span>
              <el-button
                link
                type="primary"
                size="small"
                @click="startEdit(cat)"
                >编辑</el-button
              >
              <el-button link type="danger" size="small" @click="doDelete(cat)"
                >删除</el-button
              >
            </template>
          </li>
        </ul>
      </div>

      <!-- 新增 -->
      <div class="add-row">
        <el-input
          v-model="newCatName"
          placeholder="输入新分类名称"
          size="small"
          style="flex: 1"
          @keyup.enter="doAdd"
        />
        <el-button type="primary" size="small" :loading="adding" @click="doAdd"
          >新增</el-button
        >
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.cat-section {
  margin-bottom: 16px;

  &-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  &-hint {
    font-size: 12px;
    font-weight: normal;
    color: #909399;
  }
}

.system-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.system-tag {
  cursor: default;
}

.empty-hint {
  padding: 8px 0;
  font-size: 13px;
  color: #909399;
}

.sort-list {
  padding: 0;
  margin: 0;
  list-style: none;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.sort-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f5f7fa;
  }
}

.drag-handle {
  flex-shrink: 0;
  font-size: 18px;
  color: #909399;
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.sort-item-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.edit-input {
  flex: 1;
}

.add-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.sortable-ghost {
  background: #ecf5ff;
  opacity: 0.4;
}
</style>
