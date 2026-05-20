<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import {
  getPurchaseOrderList,
  getSupplierList,
  addPurchaseOrder,
  updatePurchaseOrderStatus,
  getPurchaseOrderItems,
  payPurchaseOrder,
  getMaterialList
} from "@/api/inventory";

defineOptions({ name: "InvPurchase" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({ status: "" as any });

// 新增/编辑弹窗
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const formLoading = ref(false);
const suppliers = ref<any[]>([]);
const materials = ref<any[]>([]);
const currentShopId = useUserStoreHook()?.currentShopId ?? 0;

const form = reactive({
  supplierId: "",
  orderDate: "",
  type: 1,
  remark: "",
  items: [] as any[]
});

const rules: FormRules = {
  supplierId: [{ required: true, message: "请选择供应商", trigger: "change" }],
  orderDate: [{ required: true, message: "请选择日期", trigger: "change" }]
};

// 明细弹窗
const itemsVisible = ref(false);
const itemsList = ref<any[]>([]);

const load = async () => {
  loading.value = true;
  try {
    const r = await getPurchaseOrderList({ page: page.value, size: size.value, ...query });
    if (r?.success) {
      tableData.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.status = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const loadSuppliers = async () => {
  const r = await getSupplierList(1, 999);
  if (r?.success) suppliers.value = r.data.list;
};

const loadMaterials = async () => {
  const r = await getMaterialList({ page: 1, size: 999, category: "", type: "" });
  if (r?.success) materials.value = r.data.list;
};

const openAdd = () => {
  Object.assign(form, { supplierId: "", orderDate: "", type: 1, remark: "", items: [] });
  loadSuppliers();
  loadMaterials();
  dialogVisible.value = true;
  setTimeout(() => formRef.value?.clearValidate(), 0);
};

const addItem = () => {
  form.items.push({ materialId: "", quantity: 1, unitPrice: "0" });
};

const removeItem = (i: number) => {
  form.items.splice(i, 1);
};

// 物料选中时自动填充单价
const onMaterialChange = (idx: number, materialId: string) => {
  const m = materials.value.find((t: any) => String(t.id) === materialId);
  // 暂不从后端取价格，保留手动填写
};

const save = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.items.length === 0) {
    message("请至少添加一项采购明细", { type: "warning" });
    return;
  }
  for (const item of form.items) {
    if (!item.materialId) {
      message("请为每项明细选择物料", { type: "warning" });
      return;
    }
  }
  formLoading.value = true;
  try {
    const r = await addPurchaseOrder({
      supplierId: form.supplierId,
      orderDate: form.orderDate,
      type: form.type,
      remark: form.remark,
      items: JSON.stringify(form.items)
    } as any);
    if (r?.success) {
      message("采购单已创建", { type: "success" });
      dialogVisible.value = false;
      load();
    } else {
      message(r?.msg || "创建失败", { type: "warning" });
    }
  } finally {
    formLoading.value = false;
  }
};

const updateStatus = async (id: number, st: number) => {
  let confirmText = "";
  if (st === 2) confirmText = "确认完成该采购单？完成后将自动入库。";
  else if (st === 3) confirmText = "确认取消该采购单？";
  try {
    await ElMessageBox.confirm(confirmText, "提示", { type: "warning" });
  } catch {
    return;
  }
  const r = await updatePurchaseOrderStatus({ orderId: id, status: st } as any);
  if (r?.success) {
    message(st === 2 ? "已完成，已自动入库" : "已取消", { type: "success" });
    load();
  } else {
    message(r?.msg || "操作失败", { type: "warning" });
  }
};

const openItems = async (id: number) => {
  const r = await getPurchaseOrderItems(id);
  if (r?.success) itemsList.value = r.data || [];
  itemsVisible.value = true;
};

const payOrder = async (id: number) => {
  const { value } = await ElMessageBox.prompt("请输入付款金额", "付款", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    inputPattern: /^\d+(\.\d{1,2})?$/,
    inputErrorMessage: "请输入有效的金额"
  });
  if (value) {
    const r = await payPurchaseOrder({
      orderId: id,
      amount: value,
      paymentMethod: "cash",
      paidAt: new Date().toISOString().split("T")[0]
    } as any);
    if (r?.success) {
      message("付款成功", { type: "success" });
      load();
    } else {
      message(r?.msg || "付款失败", { type: "warning" });
    }
  }
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline class="page-search">
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 130px">
            <el-option label="进行中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已取消" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" v-auth="'btn:purchaseOrder:add'" @click="openAdd">
            新增采购单
          </el-button>
        </div>
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" stripe border style="width: 100%">
        <template #empty>
          <el-empty description="暂无采购单" :image-size="80" />
        </template>
        <el-table-column prop="order_number" label="单号" width="170" />
        <el-table-column prop="supplier_name" label="供应商" width="130" />
        <el-table-column prop="total_amount" label="总金额" width="90" align="right" />
        <el-table-column prop="paid_amount" label="已付" width="90" align="right" />
        <el-table-column label="结算" width="70" align="center">
          <template #default="{ row }">
            {{ row.type === 1 ? "现结" : "赊账" }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 1 ? 'warning' : row.status === 2 ? 'success' : 'info'"
              size="small"
            >
              {{ ["", "进行中", "已完成", "已取消"][row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openItems(row.id)">明细</el-button>
            <el-button v-if="row.status === 1" link type="success" @click="updateStatus(row.id, 2)">
              完成
            </el-button>
            <el-button v-if="row.status === 1" link type="primary" @click="payOrder(row.id)">
              付款
            </el-button>
            <el-button v-if="row.status === 1" link type="danger" @click="updateStatus(row.id, 3)">
              取消
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

    <!-- 新增/编辑采购单弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增采购单" width="680px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplierId">
              <el-select v-model="form.supplierId" placeholder="请选择供应商" style="width: 100%">
                <template v-if="suppliers.length === 0">
                  <el-empty description="暂无供应商，请先添加" :image-size="40" />
                </template>
                <el-option
                  v-for="s in suppliers"
                  :key="s.id"
                  :label="s.name"
                  :value="s.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日期" prop="orderDate">
              <el-date-picker
                v-model="form.orderDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="结算方式">
          <el-radio-group v-model="form.type">
            <el-radio :value="1">现结</el-radio>
            <el-radio :value="2">赊账</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="采购明细">
          <div class="mb-2">
            <el-button size="small" type="primary" @click="addItem">+ 添加物料</el-button>
            <span class="text-xs text-dim ml-1">至少添加一项</span>
          </div>
          <div v-if="form.items.length === 0" class="text-center py-3 text-xs text-dim">
            暂无明细，请点击"添加物料"
          </div>
          <div
            v-for="(item, i) in form.items"
            :key="i"
            class="flex items-center gap-2 mb-2 p-2 rounded"
            style="background: var(--el-fill-color-light)"
          >
            <span class="text-xs text-dim w-6">{{ i + 1 }}</span>
            <el-select
              v-model="item.materialId"
              placeholder="选择物料"
              filterable
              style="width: 200px"
              @change="onMaterialChange(i, item.materialId)"
            >
              <el-option
                v-for="m in materials"
                :key="m.id"
                :label="`${m.name} (${m.sku || '-'})`"
                :value="String(m.id)"
              />
            </el-select>
            <el-input-number
              v-model="item.quantity"
              :min="1"
              placeholder="数量"
              style="width: 100px"
            />
            <el-input
              v-model="item.unitPrice"
              placeholder="单价"
              style="width: 100px"
            />
            <el-button size="small" type="danger" plain @click="removeItem(i)">删除</el-button>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填备注" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 采购明细弹窗 -->
    <el-dialog v-model="itemsVisible" title="采购明细" width="500px">
      <template v-if="itemsList.length">
        <el-table :data="itemsList" stripe size="small">
          <el-table-column prop="material_name" label="物料" min-width="140" />
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column prop="unit_price" label="单价" width="100" align="right" />
          <el-table-column label="小计" width="100" align="right">
            <template #default="{ row }">
              {{ ((row.quantity || 0) * (row.unit_price || 0)).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template v-else>
        <el-empty description="暂无明细" :image-size="60" />
      </template>
    </el-dialog>
  </div>
</template>
