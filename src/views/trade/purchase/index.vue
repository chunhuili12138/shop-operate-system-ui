<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@/utils/message";
import { getPurchaseList } from "@/api/trade";
import { getDictData } from "@/api/dict";
import type { PurchaseRecord } from "@/api/trade";
import PurchaseDialog from "./components/PurchaseDialog.vue";
import RefundDialog from "./components/RefundDialog.vue";
import PurchaseDetailDrawer from "./components/PurchaseDetailDrawer.vue";

defineOptions({ name: "TradePurchase" });

const tableData = ref<PurchaseRecord[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const dialogVisible = ref(false);
const refundVisible = ref(false);
const refundPid = ref(0);
const detailVisible = ref(false);
const detailPid = ref(0);
const detailPkgName = ref("");

const query = reactive({
  keyword: "",
  channel: "",
  status: "",
  startDate: "",
  endDate: ""
});

const channelOptions = ref<any[]>([]);
const paymentOptions = ref<any[]>([]);
const statusMap: Record<number, string> = { 1: "有效", 2: "已退款", 3: "已过期" };
const statusTypeMap: Record<number, string> = { 1: "success", 2: "warning", 3: "info" };

const channelLabel = (label: string) => {
  const item = channelOptions.value.find((d: any) => d.dict_label === label);
  return item ? item.dict_value : label;
};

const paymentLabel = (label: string) => {
  if (!label) return "-";
  const item = paymentOptions.value.find((d: any) => d.dict_label === label);
  return item ? item.dict_value : label;
};

const loadDicts = async () => {
  try {
    const [chRes, pmRes] = await Promise.all([
      getDictData("purchase_channel"),
      getDictData("payment_method")
    ]);
    if (chRes?.success && Array.isArray(chRes.data)) channelOptions.value = chRes.data;
    if (pmRes?.success && Array.isArray(pmRes.data)) paymentOptions.value = pmRes.data;
  } catch { /* ignore */ }
};

const load = async () => {
  loading.value = true;
  try {
    const r = await getPurchaseList({ page: page.value, size: size.value, ...query });
    if (r?.success) {
      tableData.value = r.data?.list || [];
      total.value = r.data?.total || 0;
    }
  } finally { loading.value = false; }
};

const reset = () => {
  query.keyword = "";
  query.channel = "";
  query.status = "";
  query.startDate = "";
  query.endDate = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => { size.value = s; page.value = 1; load(); };

const onRefund = (id: number) => {
  refundPid.value = id;
  refundVisible.value = true;
};

const onDetail = (row: PurchaseRecord) => {
  detailPid.value = row.id;
  detailPkgName.value = row.package_name || "";
  detailVisible.value = true;
};

const onAddSuccess = () => { page.value = 1; load(); };
const onRefundSuccess = () => { page.value = 1; load(); };

onMounted(() => { loadDicts(); load(); });
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" clearable placeholder="顾客/套餐名" style="width:180px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="query.channel" clearable placeholder="全部" style="width:120px">
            <el-option v-for="c in channelOptions" :key="c.dict_label" :label="c.dict_value" :value="c.dict_label" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width:110px">
            <el-option label="有效" value="1" />
            <el-option label="已退款" value="2" />
            <el-option label="已过期" value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div><el-button type="primary" @click="dialogVisible = true">新增购买</el-button></div>
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" style="width:100%">
        <el-table-column prop="customer_name" label="顾客" min-width="100" />
        <el-table-column prop="package_name" label="套餐" min-width="100" />
        <el-table-column label="渠道" width="80" align="center">
          <template #default="{ row }">{{ channelLabel(row.channel) }}</template>
        </el-table-column>
        <el-table-column label="支付方式" width="90" align="center">
          <template #default="{ row }">{{ paymentLabel(row.payment_method) }}</template>
        </el-table-column>
        <el-table-column prop="total_amount" label="套餐金额" width="90" align="center" />
        <el-table-column prop="paid_amount" label="实付" width="90" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" />
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="onDetail(row)">明细</el-button>
            <el-button v-if="row.status === 1" link type="danger" size="small" @click="onRefund(row.id)">退款</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无购买记录" /></template>
      </el-table>
    </div>

    <el-pagination
      v-model:current-page="page" v-model:page-size="size" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination" @size-change="onSizeChange" @current-change="load"
    />

    <PurchaseDialog v-model:visible="dialogVisible" @success="onAddSuccess" />
    <RefundDialog v-model:visible="refundVisible" :purchase-id="refundPid" @success="onRefundSuccess" />
    <PurchaseDetailDrawer
      v-model:visible="detailVisible"
      :purchase-id="detailPid"
      :package-name="detailPkgName"
    />
  </div>
</template>
