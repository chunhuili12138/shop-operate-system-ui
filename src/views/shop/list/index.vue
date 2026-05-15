<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import {
  getShopList,
  getShopInfo,
  updateShopStatus,
  deleteShop
} from "@/api/shop";
import { getTenantList } from "@/api/tenant";
import ShopFormDialog from "./components/ShopFormDialog.vue";

defineOptions({ name: "ShopList" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "", status: "" as any, ownerStaffId: "" });

const dialogVisible = ref(false);
const isEdit = ref(false);
const currentShopData = ref(null);

const tenantOptions = ref([] as any[]);

const load = async () => {
  loading.value = true;
  try {
    const r = await getShopList({
      page: page.value,
      size: size.value,
      ...query
    });
    if (r?.success) {
      tableData.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.keyword = "";
  query.status = "";
  query.ownerStaffId = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const toggle = async (id: number, status: number) => {
  const actionText = status === 1 ? "设为休息" : "设为营业";
  await ElMessageBox.confirm(`确认${actionText}？`, "提示");
  const r = await updateShopStatus({
    shopsId: id,
    status: status ? 0 : 1
  });
  if (r?.success) {
    message("已切换", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const doDelete = async (id: number) => {
  await ElMessageBox.confirm("确认删除？", "提示");
  const r = await deleteShop(id);
  if (r?.success) {
    message("已删除", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openAdd = () => {
  isEdit.value = false;
  currentShopData.value = null;
  dialogVisible.value = true;
};

const openEdit = async (id: number) => {
  const r = await getShopInfo(id);
  if (r?.success) {
    currentShopData.value = r.data;
    isEdit.value = true;
    dialogVisible.value = true;
  }
};

// 表单提交成功回调
const handleFormSuccess = () => {
  load();
};

const loadTenants = async () => {
  try {
    const r = await getTenantList({ page: 1, size: 999 });
    if (r?.success) tenantOptions.value = r.data.list || [];
  } catch (error) {
    console.error("加载商户列表失败:", error);
  }
};

onMounted(() => {
  load();
  loadTenants();
});
</script>

<template>
  <div class="page-container">
    <!-- 搜索/筛选区 -->
    <div class="page-header">
      <el-form :model="query" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="店铺名称/手机号"
            clearable
            style="width: 180px"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="所属商户">
          <el-select
            v-model="query.ownerStaffId"
            clearable
            placeholder="全部"
            filterable
            style="width: 160px"
          >
            <el-option
              v-for="t in tenantOptions"
              :key="t.id"
              :label="t.name"
              :value="t.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="营业状态">
          <el-select
            v-model="query.status"
            clearable
            placeholder="全部"
            style="width: 120px"
          >
            <el-option label="营业中" :value="1" />
            <el-option label="休息" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd"> + 新增店铺 </el-button>
        </div>
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="店铺名称" width="150" />
        <el-table-column prop="owner_name" label="所属商户" width="120" />
        <el-table-column prop="max_capacity" label="最大容量" width="90" />
        <el-table-column prop="contact_phone" label="电话" width="130" />
        <el-table-column
          prop="address"
          label="地址"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column prop="description" label="描述" min-width="160" />
        <el-table-column label="营业状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 1 ? 'success' : 'danger'"
              size="small"
            >
              {{ row.status === 1 ? "营业中" : "休息" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row.id)">
              编辑
            </el-button>
            <el-button
              link
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggle(row.id, row.status)"
            >
              {{ row.status === 1 ? "设为休息" : "设为营业" }}
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

    <!-- 表单弹窗 -->
    <ShopFormDialog
      v-model:visible="dialogVisible"
      :is-edit="isEdit"
      :shop-data="currentShopData"
      @success="handleFormSuccess"
    />
  </div>
</template>
