<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import type { MaterialListResult } from "@/api/inventory";
import { getMaterialList, deleteMaterial } from "@/api/inventory";
import {
  getInventoryWarnings,
  inventoryInbound,
  inventoryOutbound,
  getInventoryTransactions,
  type InventoryIoParams
} from "@/api/inventory";
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

const categoryOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);

// 对话框状态
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentFormData = ref<any>(null);
const formDialogRef = ref<InstanceType<typeof MaterialFormDialog>>();
const categoryManageVisible = ref(false);
const currentShopId = useUserStoreHook()?.currentShopId ?? 0;

// 库存相关
const warnList = ref<any[]>([]);
const warnDialog = ref(false);
const ioDialog = ref(false);
const ioType = ref(1);
const ioForm = reactive<InventoryIoParams & { materialName?: string }>({ materialId: "", quantity: "", remark: "", materialName: "" });
const txDialog = ref(false);
const txList = ref<any[]>([]);
const txMaterialName = ref("");

// 加载分类字典
const loadCategories = async () => {
  const r = await getDictData({
    dictCode: "material_category",
    shopId: currentShopId
  } as any);
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

// 静默加载库存预警数量
const checkWarn = async () => {
  const r = await getInventoryWarnings();
  if (r?.success) warnList.value = r.data || [];
};

// 打开库存预警弹窗
const loadWarn = async () => {
  await checkWarn();
  warnDialog.value = true;
};

// 打开出入库弹窗
const openIo = (type: number, materialId: string, materialName: string) => {
  ioType.value = type;
  ioForm.materialId = materialId;
  ioForm.materialName = materialName;
  ioForm.quantity = "";
  ioForm.remark = "";
  ioDialog.value = true;
};

// 执行出入库
const doIo = async () => {
  if (!ioForm.quantity || Number(ioForm.quantity) <= 0) {
    message("请输入有效数量", { type: "warning" });
    return;
  }
  const fn = ioType.value === 1 ? inventoryInbound : inventoryOutbound;
  const r = await fn(ioForm as InventoryIoParams);
  if (r?.success) {
    message(ioType.value === 1 ? "入库成功" : "出库成功", { type: "success" });
    ioDialog.value = false;
    loadData();
  } else {
    message(r?.msg || "操作失败", { type: "warning" });
  }
};

// 查看库存流水
const openTx = async (materialId: string, materialName: string) => {
  txMaterialName.value = materialName;
  const r = await getInventoryTransactions({
    materialId,
    page: 1,
    size: 50
  });
  if (r?.success) txList.value = r.data.list;
  txDialog.value = true;
};

onMounted(() => {
  loadCategories();
  checkWarn();
  loadData();
});
</script>
<template>
  <div class="page-container">
    <!-- 库存预警横幅 -->
    <div
      v-if="warnList.length"
      class="page-warn flex items-center gap-2 cursor-pointer"
      @click="warnDialog = true"
    >
      <span class="text-sm font-medium" style="color: var(--el-color-danger)">
        {{ warnList.length }} 项库存预警
      </span>
      <span class="text-xs text-dim">点击查看详情</span>
    </div>

    <div class="page-header">
      <el-form :model="queryParams" inline class="page-search">
        <el-form-item label="关键词"
          ><el-input
            v-model="queryParams.keyword"
            clearable
            @keyup.enter="loadData"
        /></el-form-item>
        <el-form-item label="分类"
          ><el-select
            v-model="queryParams.category"
            clearable
            style="width: 130px"
            ><el-option
              v-for="c in categoryOptions"
              :key="c.dict_key"
              :label="c.dict_value"
              :value="c.dict_value" /></el-select
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
          <el-button type="primary" @click="openAddDialog">新增物料</el-button>
          <el-button
            v-auth="'btn:material:category'"
            @click="categoryManageVisible = true"
            >分类管理</el-button
          >
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
        <el-table-column prop="name" label="名称" min-width="100" />
        <el-table-column prop="sku" label="SKU" width="120" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="quantity" label="库存量" width="80" align="center">
          <template #default="{ row }">
            {{ row.quantity ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="60" align="center" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            {{ ["", "消耗品", "工具"][row.type] }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag
              :type="(row.quantity || 0) <= (row.min_stock || 0) ? 'danger' : 'success'"
              size="small"
            >
              {{ (row.quantity || 0) <= (row.min_stock || 0) ? "不足" : "正常" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)"
              >编辑</el-button
            >
            <el-button link type="danger" @click="deleteData(row.id)"
              >删除</el-button
            >
            <el-button link type="success" @click="openIo(1, row.id, row.name)"
              >入库</el-button
            >
            <el-button link type="warning" @click="openIo(2, row.id, row.name)"
              >出库</el-button
            >
            <el-button link type="info" @click="openTx(row.id, row.name)"
              >流水</el-button
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
      @refresh="
        () => {
          loadCategories();
          formDialogRef?.reloadCategories();
        }
      "
    />

    <!-- 库存预警弹窗 -->
    <el-dialog v-model="warnDialog" title="库存预警" width="520px" class="dialog-md">
      <template v-if="warnList.length">
        <div class="flex flex-col gap-2">
          <div
            v-for="w in warnList"
            :key="w.id"
            class="flex items-center justify-between px-3 py-2 rounded-md text-sm"
            style="background: rgba(248, 81, 73, 0.06)"
          >
            <span>{{ w.material_name }}</span>
            <span class="text-xs text-dim">
              库存 {{ w.quantity }} {{ w.unit }} / 预警值 {{ w.min_stock }}
            </span>
          </div>
        </div>
      </template>
      <template v-else>
        <el-empty description="暂无库存预警" :image-size="60" />
      </template>
    </el-dialog>

    <!-- 出入库弹窗 -->
    <el-dialog
      v-model="ioDialog"
      :title="ioType === 1 ? '入库' : '出库'"
      width="440px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form :model="ioForm" label-width="80px">
        <el-form-item label="物料">
          <el-input :model-value="ioForm.materialName" disabled />
        </el-form-item>
        <el-form-item label="数量" required>
          <el-input v-model="ioForm.quantity" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="ioForm.remark" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ioDialog = false">取消</el-button>
        <el-button type="primary" @click="doIo">确认</el-button>
      </template>
    </el-dialog>

    <!-- 库存流水弹窗 -->
    <el-dialog
      v-model="txDialog"
      :title="'库存流水 - ' + txMaterialName"
      width="600px"
      class="dialog-md"
    >
      <template v-if="txList.length">
        <el-table :data="txList" size="small" style="width: 100%">
          <el-table-column label="类型" width="70">
            <template #default="{ row }">
              <el-tag
                :type="row.transaction_type === 1 ? 'success' : 'warning'"
                size="small"
              >
                {{ row.transaction_type === 1 ? "入库" : "出库" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column
            prop="balance_after"
            label="变更后"
            width="80"
            align="center"
          />
          <el-table-column prop="remark" label="备注" min-width="120" />
          <el-table-column prop="created_at" label="时间" width="170" />
        </el-table>
      </template>
      <template v-else>
        <el-empty description="暂无流水记录" :image-size="60" />
      </template>
    </el-dialog>
  </div>
</template>
