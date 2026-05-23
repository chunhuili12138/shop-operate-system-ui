<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import {
  getCouponList,
  updateCouponStatus,
  deleteCoupon
} from "@/api/marketing";
import { getDictData } from "@/api/dict";
import CouponFormDialog from "./components/CouponFormDialog.vue";
import CouponUsageDialog from "./components/CouponUsageDialog.vue";
import CouponGrantDialog from "./components/CouponGrantDialog.vue";

defineOptions({ name: "MktCoupon" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({
  keyword: "",
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  useScene: "" as string
});

const formVisible = ref(false);
const editRow = ref<any>(null);
const usageVisible = ref(false);
const usageCouponId = ref(0);
const grantVisible = ref(false);
const grantCouponId = ref(0);
const grantCouponName = ref("");
const grantCouponType = ref(1);
const grantCouponValue = ref(0);
const grantRemainStock = ref(0);
const grantPerUserLimit = ref(1);

const typeOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);
const sceneOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);

const typeLabel = (key: number) => {
  const found = typeOptions.value.find(s => s.dict_key === key);
  return found?.dict_value || key;
};
const sceneLabel = (key: string) => {
  const found = sceneOptions.value.find(s => s.dict_label === key);
  return found?.dict_value || key;
};

const load = async () => {
  loading.value = true;
  try {
    const r = await getCouponList({
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

const loadDicts = async () => {
  try {
    const [tR, sR] = await Promise.all([
      getDictData("coupon_type"),
      getDictData("coupon_use_scene")
    ]);
    if (tR?.success && Array.isArray(tR.data)) typeOptions.value = tR.data;
    if (sR?.success && Array.isArray(sR.data)) sceneOptions.value = sR.data;
  } catch {
    /* ignore */
  }
};

const reset = () => {
  query.keyword = "";
  query.type = undefined;
  query.status = undefined;
  query.useScene = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const openAdd = () => {
  editRow.value = null;
  formVisible.value = true;
};

const openEdit = (row: any) => {
  editRow.value = row;
  formVisible.value = true;
};

const toggle = async (id: number, active: number) => {
  const r = await updateCouponStatus({
    couponId: id,
    isActive: active ? 0 : 1
  });
  if (r?.success) {
    message("已切换", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const handleDelete = async (row: any) => {
  const r = await deleteCoupon(row.id);
  if (r?.success) {
    message("已删除", { type: "success" });
    load();
  } else {
    message(r?.msg || "删除失败", { type: "warning" });
  }
};

const openUsage = (id: number) => {
  usageCouponId.value = id;
  usageVisible.value = true;
};

const openGrant = (row: any) => {
  grantCouponId.value = row.id;
  grantCouponName.value = row.name;
  grantCouponType.value = row.type;
  grantCouponValue.value = Number(row.value) || 0;
  grantRemainStock.value = row.remain_stock ?? 0;
  grantPerUserLimit.value = row.per_user_limit ?? 1;
  grantVisible.value = true;
};

onMounted(() => {
  loadDicts().then(() => load());
});
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline>
        <el-form-item label="名称">
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="优惠券名称"
            style="width: 160px"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="query.type"
            clearable
            placeholder="全部"
            style="width: 120px"
          >
            <el-option
              v-for="s in typeOptions"
              :key="s.dict_key"
              :label="s.dict_value"
              :value="s.dict_key"
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
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="场景">
          <el-select
            v-model="query.useScene"
            clearable
            placeholder="全部"
            style="width: 120px"
          >
            <el-option
              v-for="s in sceneOptions"
              :key="s.dict_key"
              :label="s.dict_value"
              :value="s.dict_label"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">新增优惠券</el-button>
        </div>
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="名称" width="250" />
        <el-table-column
          prop="description"
          label="描述"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.description || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            {{ typeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column label="场景" width="100" align="center">
          <template #default="{ row }">
            {{ sceneLabel(row.use_scene) }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="面值" width="100" align="center" />
        <el-table-column
          prop="per_user_limit"
          label="限领"
          width="70"
          align="center"
        />
        <el-table-column
          prop="total_stock"
          label="库存"
          width="70"
          align="center"
        />
        <el-table-column
          prop="remain_stock"
          label="剩余"
          width="70"
          align="center"
        />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button link type="primary" @click="openUsage(row.id)">
              使用记录
            </el-button>
            <el-button link type="primary" @click="openGrant(row)"
              >发放</el-button
            >
            <el-button
              link
              :type="row.is_active ? 'warning' : 'success'"
              @click="toggle(row.id, row.is_active)"
            >
              {{ row.is_active ? "禁用" : "启用" }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)"
              >删除</el-button
            >
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

    <CouponFormDialog
      v-model:visible="formVisible"
      :edit-row="editRow"
      @submit="load"
    />

    <CouponUsageDialog
      v-model:visible="usageVisible"
      :coupon-id="usageCouponId"
    />

    <CouponGrantDialog
      v-model:visible="grantVisible"
      :coupon-id="grantCouponId"
      :coupon-name="grantCouponName"
      :coupon-type="grantCouponType"
      :coupon-value="grantCouponValue"
      :remain-stock="grantRemainStock"
      :per-user-limit="grantPerUserLimit"
      @submit="load"
    />
  </div>
</template>
