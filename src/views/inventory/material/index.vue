<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import type { MaterialListResult } from "@/api/inventory";
import { getMaterialList, deleteMaterial } from "@/api/inventory";
import { getDictData } from "@/api/system";
import { useUserStoreHook } from "@/store/modules/user";
import MaterialFormDialog from "./components/MaterialFormDialog.vue";
import CategoryManageDialog from "./components/CategoryManageDialog.vue";

defineOptions({ name: "InvMaterial" });

// 数据状态
const materialList = ref<any[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 查询参数
interface QueryParams {
  keyword: string;
  type: number | string;
  category: string;
}

const queryParams = reactive<QueryParams>({
  keyword: "",
  type: "",
  category: ""
});

const categoryOptions = ref<{ dict_key: number; dict_value: string; dict_label: string }[]>([]);

// 对话框状态
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentFormData = ref<any>(null);
const formDialogRef = ref<InstanceType<typeof MaterialFormDialog>>();
const categoryManageVisible = ref(false);
const currentShopId = useUserStoreHook()?.currentShopId ?? 0;

// 加载分类字典
const loadCategories = async () => {
  const r = await getDictData({ dictCode: "material_category", shopId: currentShopId } as any);
  if (r?.success && Array.isArray(r.data)) categoryOptions.value = r.data;
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const res = (await getMaterialList({
      page: currentPage.value,
      size: pageSize.value,
      keyword: queryParams.keyword,
      type: queryParams.type,
      category: queryParams.category
    })) as MaterialListResult;

    if (res?.success) {
      materialList.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (error) {
    message("加载失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 重置查询
const resetQuery = () => {
  queryParams.keyword = "";
  queryParams.type = "";
  queryParams.category = "";
  currentPage.value = 1;
  loadData();
};

// 分页大小改变
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadData();
};

// 打开新增对话框
const openAddDialog = () => {
  isEdit.value = false;
  currentFormData.value = null;
  dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = (row: any) => {
  isEdit.value = true;
  currentFormData.value = {
    materialId: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    unit: row.unit,
    type: row.type,
    minStock: row.min_stock,
    remark: row.remark
  };
  dialogVisible.value = true;
};

// 删除数据
const deleteData = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除该物料吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    const res = await deleteMaterial(id);
    if (res?.success) {
      message("删除成功", { type: "success" });
      loadData();
    } else {
      message(res?.msg || "删除失败", { type: "warning" });
    }
  } catch (error) {
    // 用户取消删除
    if (error !== "cancel") {
      message("删除失败", { type: "error" });
    }
  }
};

onMounted(() => {
  loadCategories();
  loadData();
});
</script>
<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="queryParams" inline class="page-search">
        <el-form-item label="关键词"
          ><el-input
            v-model="queryParams.keyword"
            clearable
            @keyup.enter="loadData"
        /></el-form-item>
        <el-form-item label="分类"
          ><el-select v-model="queryParams.category" clearable style="width: 130px"
            ><el-option
              v-for="c in categoryOptions"
              :key="c.dict_key"
              :label="c.dict_value"
              :value="c.dict_value"
            /></el-select
        ></el-form-item>
        <el-form-item label="类型"
          ><el-select v-model="queryParams.type" clearable style="width: 100px"
            ><el-option label="消耗品" :value="1" /><el-option
              label="工具"
              :value="2" /></el-select
        ></el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="success" @click="openAddDialog">新增物料</el-button>
          <el-button
            v-auth="'btn:material:category'"
            @click="categoryManageVisible = true"
          >分类管理</el-button>
        </div>
        <div>
          <el-button type="primary" @click="loadData">查询</el-button
          ><el-button @click="resetQuery">重置</el-button>
        </div>
      </div>
    </div>
    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="materialList"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="sku" label="SKU" width="150" />
        <el-table-column prop="category" label="分类" width="150" />
        <el-table-column prop="unit" label="单位" width="150" />
        <el-table-column label="类型" width="200">
          <template #default="{ row }">
            {{ ["", "消耗品", "工具"][row.type] }}
          </template>
        </el-table-column>
        <el-table-column prop="min_stock" label="最低库存" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)"
              >编辑</el-button
            >
            <el-button link type="danger" @click="deleteData(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination"
      @size-change="handleSizeChange"
      @current-change="loadData"
    />
    <MaterialFormDialog
      ref="formDialogRef"
      v-model:visible="dialogVisible"
      :is-edit="isEdit"
      :form-data="currentFormData"
      :shop-id="currentShopId"
      @success="loadData"
    />
    <CategoryManageDialog
      :visible="categoryManageVisible"
      :shop-id="currentShopId"
      @update:visible="categoryManageVisible = $event"
      @refresh="() => { loadCategories(); formDialogRef?.reloadCategories(); }"
    />
  </div>
</template>
