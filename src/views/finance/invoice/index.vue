<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { message } from "@/utils/message";
import { getInvoiceList, addInvoice, uploadInvoice } from "@/api/finance";
import { getPurchaseList } from "@/api/trade";
import { getPurchaseOrderList } from "@/api/inventory";

defineOptions({ name: "FinanceInvoice" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({ dateRange: [] as string[] });
const dialogVisible = ref(false);
const form = reactive({
  referenceType: "purchase",
  referenceId: "" as string | number,
  invoiceNumber: "",
  amount: 0,
  issuedAt: new Date().toISOString().slice(0, 10),
  imagePath: ""
});
const pendingFile = ref<File | null>(null);
const fileList = ref<any[]>([]);
const refOptions = ref<any[]>([]);
const refOptionsLoading = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, size: size.value };
    if (query.dateRange?.length === 2) { params.startDate = query.dateRange[0]; params.endDate = query.dateRange[1]; }
    const r = await getInvoiceList(params);
    if (r?.success) { tableData.value = r.data.list; total.value = r.data.total; }
  } finally { loading.value = false; }
};

const onSearch = () => { page.value = 1; load(); };
const onReset = () => { query.dateRange = []; page.value = 1; load(); };
const onSizeChange = (s: number) => { size.value = s; page.value = 1; load(); };

const loadRefOptions = async () => {
  refOptionsLoading.value = true;
  try {
    if (form.referenceType === "purchase") {
      const r = await getPurchaseList({ page: 1, size: 200 });
      if (r?.success) {
        refOptions.value = (r.data.list || []).map((p: any) => ({
          id: p.id,
          label: `${p.customer_name || "顾客" + p.customer_id} - ${p.package_name || "套餐"} - ¥${p.paid_amount || p.total_amount || 0}`,
          amount: p.paid_amount || p.total_amount || 0
        }));
      }
    } else {
      const r = await getPurchaseOrderList({ page: 1, size: 200 });
      if (r?.success) {
        refOptions.value = (r.data.list || []).map((po: any) => ({
          id: po.id,
          label: `${po.supplier_name || "供应商"} - ¥${po.total_amount || 0}`,
          amount: po.total_amount || 0
        }));
      }
    }
  } finally { refOptionsLoading.value = false; }
};

watch(() => form.referenceType, () => {
  form.referenceId = "";
  form.amount = 0;
  loadRefOptions();
});

const onRefSelect = (val: string | number) => {
  const item = refOptions.value.find((o: any) => o.id === val);
  if (item) form.amount = item.amount;
};

const openAdd = () => {
  Object.assign(form, { referenceType: "purchase", referenceId: "", invoiceNumber: "", amount: 0, issuedAt: new Date().toISOString().slice(0, 10), imagePath: "" });
  pendingFile.value = null;
  fileList.value = [];
  dialogVisible.value = true;
  loadRefOptions();
};

const handleChange = (uploadFile: any, uploadFiles: any[]) => {
  const raw = uploadFile.raw as File;
  if (!raw) return;
  if (!["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"].includes(raw.type)) {
    message("仅支持 jpg/png/gif/webp/pdf 格式", { type: "warning" });
    return;
  }
  pendingFile.value = raw;
  fileList.value = uploadFiles;
};

const handleRemove = () => { pendingFile.value = null; fileList.value = []; };

const save = async () => {
  let imagePath = "";
  if (pendingFile.value) {
    const up = await uploadInvoice(pendingFile.value);
    if (up?.success && up.data) imagePath = up.data;
    else { message(up?.msg || "图片上传失败", { type: "warning" }); return; }
  }
  const r = await addInvoice({
    ...form,
    referenceId: String(form.referenceId),
    amount: String(form.amount),
    imagePath
  } as any);
  if (r?.success) { message("新增成功", { type: "success" }); dialogVisible.value = false; load(); }
  else message(r?.msg || "失败", { type: "warning" });
};

const imageUrl = (path: string) => `/api/file/image?name=${encodeURIComponent(path)}`;

const refTypeLabel = (t: string) => t === "purchase" ? "购买记录" : t === "purchase_order" ? "采购订单" : t;

onMounted(load);
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline class="page-search">
        <el-form-item label="开票日期">
          <el-date-picker
            v-model="query.dateRange" type="daterange" range-separator="-"
            start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD"
            style="width:260px" @change="onSearch"
          />
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div><el-button type="primary" @click="openAdd">新增发票</el-button></div>
        <div>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </div>
      </div>
    </div>

    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" stripe style="width:100%">
        <el-table-column label="关联类型" width="100">
          <template #default="{ row }">{{ refTypeLabel(row.reference_type) }}</template>
        </el-table-column>
        <el-table-column prop="invoice_number" label="发票号" min-width="140" show-overflow-tooltip />
        <el-table-column label="金额" width="110" align="center">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="issued_at" label="开票日期" width="120" />
        <el-table-column label="发票图片" width="90" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.image_path"
              :src="imageUrl(row.image_path)" :preview-src-list="[imageUrl(row.image_path)]"
              style="width:40px;height:40px;border-radius:4px" fit="cover"
            />
            <span v-else class="text-dim">-</span>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无发票记录" /></template>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="page" v-model:page-size="size" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination" @size-change="onSizeChange" @current-change="load"
    />

    <el-dialog v-model="dialogVisible" title="新增发票" width="520px" :close-on-click-modal="false">
      <el-form :model="form" label-width="100px">
        <el-form-item label="关联类型" required>
          <el-select v-model="form.referenceType" style="width:100%">
            <el-option label="购买记录" value="purchase" />
            <el-option label="采购订单" value="purchase_order" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联记录" required>
          <el-select
            v-model="form.referenceId" filterable :loading="refOptionsLoading"
            placeholder="请选择关联记录" style="width:100%"
            @change="onRefSelect"
          >
            <el-option v-for="o in refOptions" :key="o.id" :label="o.label" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="发票号" required>
          <el-input v-model="form.invoiceNumber" placeholder="请输入发票编号" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" placeholder="0.00" style="width:100%" />
        </el-form-item>
        <el-form-item label="开票日期">
          <el-date-picker v-model="form.issuedAt" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="发票图片">
          <el-upload
            v-model:file-list="fileList"
            list-type="picture-card" :limit="1" :auto-upload="false"
            :on-change="handleChange" :on-remove="handleRemove" accept="image/*,.pdf"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
