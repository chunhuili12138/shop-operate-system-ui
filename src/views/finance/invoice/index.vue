<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { fileUrl } from "@/utils/file";
import { ElMessageBox } from "element-plus";
import { getInvoiceList, deleteInvoice } from "@/api/finance";
import InvoiceFormDialog from "./components/InvoiceFormDialog.vue";
import { formatDate } from "@/utils/date";

defineOptions({ name: "FinanceInvoice" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({ dateRange: [] as string[] });
const dialogVisible = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, size: size.value };
    if (query.dateRange?.length === 2) {
      params.startDate = query.dateRange[0];
      params.endDate = query.dateRange[1];
    }
    const r = await getInvoiceList(params);
    if (r?.success) {
      tableData.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  page.value = 1;
  load();
};
const onReset = () => {
  query.dateRange = [];
  page.value = 1;
  load();
};
const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const onDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除？", "提示", { type: "warning" });
  } catch {
    return;
  }
  const r = await deleteInvoice(id);
  if (r?.success) {
    message("已删除", { type: "success" });
    load();
  } else message(r?.msg || "失败", { type: "warning" });
};

const imageUrl = (path: string) =>
  fileUrl(path);
const refTypeLabel = (t: string) =>
  t === "purchase" ? "购买记录" : t === "purchase_order" ? "采购订单" : t;

onMounted(load);
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline class="page-search">
        <el-form-item label="开票日期">
          <el-date-picker
            v-model="query.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            @change="onSearch"
          />
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="dialogVisible = true"
            >新增发票</el-button
          >
        </div>
        <div>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
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
        <el-table-column label="关联类型" width="100">
          <template #default="{ row }">{{
            refTypeLabel(row.reference_type)
          }}</template>
        </el-table-column>
        <el-table-column
          prop="invoice_number"
          label="发票号"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column label="金额" width="110" align="center">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="issued_at" label="开票日期" width="120">
          <template #default="{ row }">{{
            formatDate(row.issued_at)
          }}</template>
        </el-table-column>
        <el-table-column
          prop="remark"
          label="关联记录"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column label="发票图片" width="120" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.image_path"
              :src="imageUrl(row.image_path)"
              :preview-src-list="[imageUrl(row.image_path)]"
              preview-teleported
              style="width: 40px; height: 40px; border-radius: 4px"
              fit="cover"
            />
            <span v-else class="text-dim">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="onDelete(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无发票记录" /></template>
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

    <InvoiceFormDialog v-model:visible="dialogVisible" @success="load" />
  </div>
</template>
