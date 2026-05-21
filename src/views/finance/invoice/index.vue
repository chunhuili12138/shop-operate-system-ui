<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { getInvoiceList, addInvoice } from "@/api/finance";

defineOptions({ name: "FinanceInvoice" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const dialogVisible = ref(false);
const form = reactive({ referenceType: "purchase", referenceId: "", invoiceNumber: "", amount: "", issuedAt: "" });

const load = async () => {
  loading.value = true;
  try {
    const r = await getInvoiceList({ page: page.value, size: size.value });
    if (r?.success) { tableData.value = r.data.list; total.value = r.data.total; }
  } finally { loading.value = false; }
};

const onSizeChange = (s: number) => { size.value = s; page.value = 1; load(); };

const openAdd = () => {
  Object.assign(form, { referenceType: "purchase", referenceId: "", invoiceNumber: "", amount: "", issuedAt: new Date().toISOString().slice(0, 10) });
  dialogVisible.value = true;
};

const save = async () => {
  const r = await addInvoice({ ...form } as any);
  if (r?.success) { message("新增成功", { type: "success" }); dialogVisible.value = false; load(); }
  else message(r?.msg || "失败", { type: "warning" });
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-actions">
        <div><el-button type="primary" @click="openAdd">新增发票</el-button></div>
        <div><el-button type="primary" @click="load">刷新</el-button></div>
      </div>
    </div>
    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" stripe style="width:100%">
        <el-table-column prop="reference_type" label="关联类型" width="100" />
        <el-table-column prop="reference_id" label="关联ID" width="80" />
        <el-table-column prop="invoice_number" label="发票号" />
        <el-table-column prop="amount" label="金额" width="100" />
        <el-table-column prop="issued_at" label="开票日期" width="120" />
        <template #empty><el-empty description="暂无发票记录" /></template>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="page" v-model:page-size="size" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination" @size-change="onSizeChange" @current-change="load"
    />

    <el-dialog v-model="dialogVisible" title="新增发票" width="450px" :close-on-click-modal="false">
      <el-form :model="form" label-width="90px">
        <el-form-item label="关联类型" required>
          <el-select v-model="form.referenceType" style="width:100%">
            <el-option label="购买记录" value="purchase" />
            <el-option label="采购订单" value="purchase_order" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联ID"><el-input v-model="form.referenceId" /></el-form-item>
        <el-form-item label="发票号" required><el-input v-model="form.invoiceNumber" /></el-form-item>
        <el-form-item label="金额"><el-input v-model="form.amount" /></el-form-item>
        <el-form-item label="开票日期">
          <el-date-picker v-model="form.issuedAt" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
