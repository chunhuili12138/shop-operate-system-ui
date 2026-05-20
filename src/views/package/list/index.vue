<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import {
  getPackageList,
  addPackage,
  updatePackage,
  updatePackageStatus,
  getPackageBom
} from "@/api/package";
import PackageDialog from "./components/PackageDialog.vue";
import BomDialog from "./components/BomDialog.vue";

defineOptions({ name: "PackageList" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "", type: "", status: "" });

const dialogVisible = ref(false);
const isEdit = ref(false);
const bomDialog = ref(false);
const bomList = ref([]);

const formData = reactive({
  packageId: null as number | null,
  name: "",
  type: 1,
  durationMinutes: null as number | null,
  price: "",
  maxPeoplePerSession: 1,
  description: "",
  bom: [] as any[]
});

const load = async () => {
  loading.value = true;
  try {
    const r = await getPackageList({
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
  query.type = "";
  query.status = "";
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
  Object.assign(formData, {
    packageId: null,
    name: "",
    type: 1,
    durationMinutes: null,
    price: "",
    maxPeoplePerSession: 1,
    description: "",
    bom: []
  });
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(formData, {
    packageId: row.id,
    name: row.name,
    type: row.type,
    durationMinutes: row.duration_minutes,
    price: row.price,
    maxPeoplePerSession: row.max_people_per_session,
    description: row.description,
    bom: []
  });
  dialogVisible.value = true;
};

const save = async () => {
  const r = isEdit.value
    ? await updatePackage({ ...formData, bom: JSON.stringify(formData.bom) })
    : await addPackage({ ...formData, bom: JSON.stringify(formData.bom) });
  if (r?.success) {
    message("保存成功", { type: "success" });
    dialogVisible.value = false;
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const toggle = async (id: number, status: number) => {
  const r = await updatePackageStatus({
    packageId: id,
    isActive: status ? 0 : 1
  });
  if (r?.success) {
    message("已切换", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openBom = async (id: number) => {
  const r = await getPackageBom(id);
  if (r?.success) bomList.value = r.data || [];
  bomDialog.value = true;
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <!-- 搜索/筛选区 -->
    <div class="page-header">
      <el-form :model="query" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="套餐名称"
            style="width: 180px"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="query.type"
            clearable
            placeholder="全部"
            style="width: 100px"
          >
            <el-option label="单次" :value="1" />
            <el-option label="周卡" :value="2" />
            <el-option label="月卡" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">新增套餐</el-button>
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
        <el-table-column prop="name" label="套餐名" min-width="120" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            {{ ["", "单次", "周卡", "月卡"][row.type] }}
          </template>
        </el-table-column>
        <el-table-column
          prop="duration_minutes"
          label="时长(分)"
          width="80"
          align="center"
        />
        <el-table-column prop="price" label="价格" width="80" align="center" />
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? "上架" : "下架" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button link type="primary" @click="openBom(row.id)"
              >BOM</el-button
            >
            <el-button
              link
              :type="row.is_active ? 'warning' : 'success'"
              @click="toggle(row.id, row.is_active)"
            >
              {{ row.is_active ? "下架" : "上架" }}
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

    <!-- 套餐表单弹窗 -->
    <PackageDialog
      v-model:visible="dialogVisible"
      :is-edit="isEdit"
      :form-data="formData"
      @save="save"
    />

    <!-- BOM 弹窗 -->
    <BomDialog v-model:visible="bomDialog" :bom-list="bomList" />
  </div>
</template>
