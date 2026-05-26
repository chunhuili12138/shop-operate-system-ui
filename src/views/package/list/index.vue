<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import {
  getPackageList,
  addPackage,
  updatePackage,
  updatePackageStatus,
  getPackageBom,
  deletePackage
} from "@/api/package";
import { getDictData } from "@/api/system";
import PackageDialog from "./components/PackageDialog.vue";
import BomDialog from "./components/BomDialog.vue";

defineOptions({ name: "PackageList" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "", type: "", status: "" });
const typeOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const bomDialog = ref(false);
const bomList = ref([]);
const currentShopId = useUserStoreHook()?.currentShopId ?? 0;
const packageDialogRef = ref<InstanceType<typeof PackageDialog>>();

const formData = reactive<any>({
  packageId: null,
  name: "",
  type: 1,
  durationMinutes: 60,
  price: 0,
  original_price: null,
  maxPeoplePerSession: 1,
  description: "",
  bom: []
});

const loadDicts = async () => {
  const r = await getDictData({ dictCode: "package_type" });
  if (r?.success && Array.isArray(r.data)) typeOptions.value = r.data;
};

const typeLabel = (type: number) => {
  const item = typeOptions.value.find(t => t.dict_key === type);
  return item?.dict_value || String(type);
};

const load = async () => {
  loading.value = true;
  try {
    const r = await getPackageList({
      page: page.value,
      size: size.value,
      keyword: query.keyword || undefined,
      type: query.type || undefined,
      status: query.status || undefined
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
    durationMinutes: 60,
    price: 0,
    original_price: null,
    maxPeoplePerSession: 1,
    description: "",
    image: "",
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
    original_price: row.original_price,
    maxPeoplePerSession: row.max_people_per_session,
    description: row.description,
    image: row.image || "",
    bom: []
  });
  dialogVisible.value = true;
};

const save = async () => {
  const data = packageDialogRef.value?.form;
  if (!data) return;
  const r = isEdit.value
    ? await updatePackage({ ...data, bom: JSON.stringify(data.bom) } as any)
    : await addPackage({ ...data, bom: JSON.stringify(data.bom) } as any);
  if (r?.success) {
    message(isEdit.value ? "编辑成功" : "新增成功", { type: "success" });
    dialogVisible.value = false;
    load();
  } else {
    message(r?.msg || "操作失败", { type: "warning" });
  }
};

const toggle = async (id: number, isActive: number) => {
  const r = await updatePackageStatus({
    packageId: id,
    isActive: isActive ? 0 : 1
  });
  if (r?.success) {
    message(isActive ? "已下架" : "已上架", { type: "success" });
    load();
  } else {
    message(r?.msg || "操作失败", { type: "warning" });
  }
};

const handleDelete = async (id: number, name: string) => {
  try {
    await ElMessageBox.confirm(`确认删除套餐"${name}"？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
  } catch {
    return;
  }
  const r = await deletePackage(id);
  if (r?.success) {
    message("已删除", { type: "success" });
    load();
  } else {
    message(r?.msg || "删除失败", { type: "warning" });
  }
};

const openBom = async (id: number) => {
  const r = await getPackageBom(id);
  if (r?.success) bomList.value = r.data || [];
  bomDialog.value = true;
};

onMounted(() => {
  loadDicts();
  load();
});
</script>

<template>
  <div class="page-container">
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
            style="width: 110px"
          >
            <el-option
              v-for="t in typeOptions"
              :key="t.dict_key"
              :label="t.dict_value"
              :value="t.dict_label"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            clearable
            placeholder="全部"
            style="width: 100px"
          >
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button v-auth="'btn:package:add'" type="primary" @click="openAdd"
            >新增套餐</el-button
          >
        </div>
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
      >
        <template #empty>
          <el-empty description="暂无套餐" :image-size="80" />
        </template>
        <el-table-column prop="name" label="套餐名" width="300" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            {{ typeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="duration_minutes"
          label="时长(分)"
          width="80"
          align="center"
        />
        <el-table-column label="价格" width="130" align="right">
          <template #default="{ row }">
            <template
              v-if="row.original_price && row.original_price > row.price"
            >
              <span class="text-xs text-dim line-through"
                >¥{{ Number(row.original_price).toFixed(2) }}</span
              >
              <span class="ml-1" style="color: var(--el-color-danger)"
                >¥{{ Number(row.price).toFixed(2) }}</span
              >
            </template>
            <template v-else> ¥{{ Number(row.price).toFixed(2) }} </template>
          </template>
        </el-table-column>
        <el-table-column
          prop="max_people_per_session"
          label="最大人数"
          width="100"
          align="center"
        />
        <el-table-column
          prop="description"
          label="描述"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? "上架" : "下架" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-auth="'btn:package:edit'"
              link
              type="primary"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button link type="primary" @click="openBom(row.id)"
              >物料清单</el-button
            >
            <el-button
              v-auth="'btn:package:status'"
              link
              :type="row.is_active ? 'warning' : 'success'"
              @click="toggle(row.id, row.is_active)"
            >
              {{ row.is_active ? "下架" : "上架" }}
            </el-button>
            <el-button
              v-auth="'btn:package:delete'"
              link
              type="danger"
              @click="handleDelete(row.id, row.name)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

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

    <PackageDialog
      ref="packageDialogRef"
      v-model:visible="dialogVisible"
      :is-edit="isEdit"
      :form-data="formData"
      :shop-id="currentShopId"
      @save="save"
    />

    <BomDialog v-model:visible="bomDialog" :bom-list="bomList" />
  </div>
</template>
