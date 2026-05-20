<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { formatDate } from "@/utils/date";
import { useUserStoreHook } from "@/store/modules/user";
import {
  getCustomerList,
  deleteCustomer,
  type CustomerQueryParams,
  type CustomerFormParams
} from "@/api/customer";
import { getDictData } from "@/api/system";
import FormDialog from "./components/FormDialog.vue";
import DetailDrawer from "./components/DetailDrawer.vue";
import TagManageDialog from "./components/TagManageDialog.vue";

defineOptions({ name: "CustomerList" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const sourceOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);

const query = reactive<CustomerQueryParams>({
  keyword: "",
  source: ""
});

// ---- 弹窗状态 ----
const formVisible = ref(false);
const formMode = ref<"add" | "edit">("add");
const formData = ref<CustomerFormParams | null>(null);
const formDialogRef = ref<InstanceType<typeof FormDialog>>();
const detailVisible = ref(false);
const detailCustomerId = ref<number | null>(null);
const tagManageVisible = ref(false);
const currentShopId = useUserStoreHook()?.currentShopId ?? 0;

const loadDicts = async () => {
  const r = await getDictData({ dictCode: "customer_source" });
  if (r?.success && Array.isArray(r.data)) {
    sourceOptions.value = r.data;
  }
};

const load = async () => {
  loading.value = true;
  try {
    const r = await getCustomerList({
      page: page.value,
      size: size.value,
      keyword: query.keyword || undefined,
      source: query.source || undefined
    });
    if (r?.success) {
      tableData.value = r.data.list || [];
      total.value = r.data.total || 0;
    }
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.keyword = "";
  query.source = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

// ---- 新增 ----
const openAdd = () => {
  formMode.value = "add";
  formData.value = null;
  formVisible.value = true;
};

// ---- 编辑 ----
const openEdit = (row: any) => {
  formMode.value = "edit";
  formData.value = {
    customersId: row.id,
    nickname: row.nickname,
    phone: row.phone,
    gender: row.gender,
    birthday: row.birthday,
    source: row.source || "offline",
    remark: row.remark,
    tags: row.tags || ""
  };
  formVisible.value = true;
};

// ---- 删除 ----
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确认删除顾客"${row.nickname || row.phone}"？删除后该顾客的所有关联数据（钱包、购买记录、积分、优惠券等）将被级联删除。`,
      "删除确认",
      {
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
  } catch {
    return;
  }
  const r = await deleteCustomer(row.id);
  if (r?.success) {
    message("已删除", { type: "success" });
    load();
  } else {
    message(r?.msg || "删除失败", { type: "warning" });
  }
};

// ---- 详情 ----
const openDetail = (row: any) => {
  detailCustomerId.value = row.id;
  detailVisible.value = true;
};

const sourceLabel = (key: string) => {
  const found = sourceOptions.value.find(s => s.dict_label === key);
  return found?.dict_value || key || "-";
};

const onFormSubmit = () => {
  load();
};

onMounted(() => {
  loadDicts().then(() => load());
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
            placeholder="昵称/手机号"
            clearable
            style="width: 200px"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="来源">
          <el-select
            v-model="query.source"
            clearable
            placeholder="全部"
            style="width: 140px"
          >
            <el-option
              v-for="s in sourceOptions"
              :key="s.dict_key"
              :label="s.dict_value"
              :value="s.dict_label"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">+ 新增顾客</el-button>
          <el-button
            v-auth="'btn:customer:tag'"
            @click="tagManageVisible = true"
            >标签管理</el-button
          >
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
        <template #empty>
          <el-empty description="暂无顾客数据" :image-size="80" />
        </template>
        <el-table-column prop="nickname" label="昵称" width="200">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">
              {{ row.nickname || "-" }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="性别" width="60" align="center">
          <template #default="{ row }">
            <span class="text-sm" style="color: var(--el-text-color-secondary)">
              {{ row.gender === 1 ? "男" : row.gender === 2 ? "女" : "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="birthday" label="生日" width="120">
          <template #default="{ row }">
            <span class="text-sm" style="color: var(--el-text-color-secondary)">
              {{ formatDate(row.birthday) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="140">
          <template #default="{ row }">
            <template v-if="row.tags">
              <el-tag
                v-for="(t, i) in row.tags.split(',')"
                :key="i"
                size="small"
                class="mr-1"
                >{{ t }}</el-tag
              >
            </template>
            <span
              v-else
              class="text-sm"
              style="color: var(--el-text-color-secondary)"
              >-</span
            >
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{
              sourceLabel(row.source)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="openDetail(row)"
            >
              详情
            </el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
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

    <!-- 新增/编辑弹窗 -->
    <FormDialog
      ref="formDialogRef"
      :visible="formVisible"
      :mode="formMode"
      :data="formData"
      :shop-id="currentShopId"
      @update:visible="formVisible = $event"
      @submit="onFormSubmit"
    />

    <!-- 标签管理弹窗 -->
    <TagManageDialog
      :visible="tagManageVisible"
      :shop-id="currentShopId"
      @update:visible="tagManageVisible = $event"
      @refresh="formDialogRef?.reloadTags()"
    />

    <!-- 详情抽屉 -->
    <DetailDrawer
      :visible="detailVisible"
      :customer-id="detailCustomerId"
      @update:visible="detailVisible = $event"
      @refresh="load"
    />
  </div>
</template>
