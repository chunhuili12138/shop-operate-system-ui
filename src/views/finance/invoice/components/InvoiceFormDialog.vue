<script setup lang="ts">
import { ref, watch, reactive } from "vue";
import { message } from "@/utils/message";
import { addInvoice, uploadInvoice } from "@/api/finance";
import { getPurchaseList } from "@/api/trade";
import { getPurchaseOrderList } from "@/api/inventory";
import EpPlus from "~icons/ep/plus";

defineOptions({ name: "InvoiceFormDialog" });

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "success"): void;
}>();

const form = reactive({
  referenceType: "purchase",
  referenceId: "" as string | number,
  invoiceNumber: "",
  amount: 0,
  issuedAt: new Date().toISOString().slice(0, 10),
  remark: ""
});
const pendingFile = ref<File | null>(null);
const fileList = ref<any[]>([]);
const refOptions = ref<any[]>([]);
const refOptionsLoading = ref(false);

const resetForm = () => {
  Object.assign(form, {
    referenceType: "purchase", referenceId: "", invoiceNumber: "",
    amount: 0, issuedAt: new Date().toISOString().slice(0, 10), remark: ""
  });
  pendingFile.value = null;
  fileList.value = [];
};

watch(() => props.visible, (v) => {
  if (v) { resetForm(); loadRefOptions(); }
});

const loadRefOptions = async (keyword?: string) => {
  refOptionsLoading.value = true;
  try {
    if (form.referenceType === "purchase") {
      const r = await getPurchaseList({ page: 1, size: keyword ? 30 : 30, keyword });
      if (r?.success) {
        refOptions.value = (r.data.list || []).map((p: any) => ({
          id: p.id,
          label: `${p.customer_name || "顾客" + p.customer_id} - ${p.package_name || "套餐"} - ¥${p.paid_amount || p.total_amount || 0}`,
          amount: p.paid_amount || p.total_amount || 0
        }));
      }
    } else {
      const r = await getPurchaseOrderList({ page: 1, size: 30, keyword });
      if (r?.success) {
        refOptions.value = (r.data.list || []).map((po: any) => ({
          id: po.id,
          label: `${po.order_number || "单号"} - ${po.supplier_name || "供应商"} - ¥${po.total_amount || 0}`,
          amount: po.total_amount || 0
        }));
      }
    }
  } finally { refOptionsLoading.value = false; }
};

const remoteSearch = (query: string) => {
  if (query) loadRefOptions(query);
  else loadRefOptions();
};

watch(() => form.referenceType, () => {
  form.referenceId = "";
  form.amount = 0;
  loadRefOptions();
});

const onRefSelect = (val: string | number) => {
  const item = refOptions.value.find((o: any) => o.id === val);
  if (item) {
    form.amount = item.amount;
    form.remark = item.label;
  }
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
    ...form, referenceId: String(form.referenceId), amount: String(form.amount), imagePath
  } as any);
  if (r?.success) {
    message("新增成功", { type: "success" });
    emit("update:visible", false);
    emit("success");
  } else message(r?.msg || "失败", { type: "warning" });
};
</script>

<template>
  <el-dialog
    :model-value="visible" title="新增发票" width="520px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="关联类型" required>
        <el-select v-model="form.referenceType" style="width:100%">
          <el-option label="购买记录" value="purchase" />
          <el-option label="采购订单" value="purchase_order" />
        </el-select>
      </el-form-item>
      <el-form-item label="关联记录" required>
        <el-select
          v-model="form.referenceId" filterable remote :remote-method="remoteSearch"
          :loading="refOptionsLoading" placeholder="请选择关联记录" style="width:100%" @change="onRefSelect"
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
          v-model:file-list="fileList" list-type="picture-card" :limit="1"
          :auto-upload="false" :on-change="handleChange" :on-remove="handleRemove"
          accept="image/*,.pdf"
        >
          <EpPlus />
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
