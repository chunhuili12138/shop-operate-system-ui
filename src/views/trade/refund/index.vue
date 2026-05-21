<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { getRefundList, approveRefund, rejectRefund } from "@/api/trade";
import { getDictData } from "@/api/dict";
import type { RefundRecord } from "@/api/trade";

defineOptions({ name: "TradeRefund" });

const tableData = ref<RefundRecord[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const paymentOptions = ref<any[]>([]);
const query = reactive({ keyword: "", status: "", startDate: "", endDate: "" });

const statusMap: Record<number, { text: string; type: string }> = {
  1: { text: "处理中", type: "warning" },
  2: { text: "已完成", type: "success" },
  3: { text: "已拒绝", type: "info" }
};

const paymentLabel = (label: string) => {
  if (!label) return "-";
  const item = paymentOptions.value.find((d: any) => d.dict_label === label);
  return item ? item.dict_value : label;
};

const loadDicts = async () => {
  try {
    const r = await getDictData("payment_method");
    if (r?.success && Array.isArray(r.data)) paymentOptions.value = r.data;
  } catch {
    /* ignore */
  }
};

const load = async () => {
  loading.value = true;
  try {
    const r = await getRefundList({
      page: page.value,
      size: size.value,
      keyword: query.keyword || undefined,
      status: query.status || undefined,
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined
    });
    if (r?.success) {
      tableData.value = r.data?.list || [];
      total.value = r.data?.total || 0;
    }
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.keyword = "";
  query.status = "";
  query.startDate = "";
  query.endDate = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const onApprove = async (id: number) => {
  const r = await approveRefund(id);
  if (r?.success) {
    message("已确认退款", { type: "success" });
    load();
  } else message(r?.msg || "操作失败", { type: "warning" });
};

const onReject = async (id: number) => {
  const { value } = await ElMessageBox.prompt("输入拒绝原因", "拒绝退款");
  if (value) {
    const r = await rejectRefund(id, value);
    if (r?.success) {
      message("已拒绝", { type: "success" });
      load();
    } else message(r?.msg || "操作失败", { type: "warning" });
  }
};

onMounted(() => {
  loadDicts();
  load();
});
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline class="page-search">
        <el-form-item label="顾客">
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="顾客姓名"
            style="width: 140px"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            clearable
            placeholder="全部"
            style="width: 120px"
          >
            <el-option label="处理中" value="1" />
            <el-option label="已完成" value="2" />
            <el-option label="已拒绝" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请日期">
          <el-date-picker
            v-model="query.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="开始日期"
            style="width: 140px"
          />
          <span style="margin: 0 8px">~</span>
          <el-date-picker
            v-model="query.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="结束日期"
            style="width: 140px"
          />
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div />
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
        style="width: 100%"
      >
        <el-table-column prop="customer_name" label="顾客" width="150" />
        <el-table-column label="支付方式" width="90" align="center">
          <template #default="{ row }">{{
            paymentLabel(row.payment_method)
          }}</template>
        </el-table-column>
        <el-table-column prop="purchase_amount" label="购买金额" width="100" />
        <el-table-column prop="refund_amount" label="退款金额" width="100" />
        <el-table-column
          prop="deducted_amount"
          label="扣除"
          width="80"
          align="center"
        />
        <el-table-column
          prop="refunded_sessions"
          label="退还场次"
          width="80"
          align="center"
        />
        <el-table-column
          prop="reason"
          label="原因"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
              {{ statusMap[row.status]?.text || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="170" />
        <el-table-column prop="updated_at" label="处理时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              type="success"
              size="small"
              @click="onApprove(row.id)"
              >确认</el-button
            >
            <el-button
              v-if="row.status === 1"
              type="danger"
              size="small"
              @click="onReject(row.id)"
              >拒绝</el-button
            >
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无退款记录" /></template>
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
  </div>
</template>
