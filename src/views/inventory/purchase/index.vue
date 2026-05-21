<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import {
  getPurchaseOrderList,
  getSupplierList,
  updatePurchaseOrderStatus,
  getPurchaseOrderItems,
  payPurchaseOrder,
  getMaterialList
} from "@/api/inventory";
import PurchaseDialog from "./components/PurchaseDialog.vue";
import ItemsDialog from "./components/ItemsDialog.vue";

defineOptions({ name: "InvPurchase" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({ status: "" as any });

// 新增/编辑弹窗
const dialogVisible = ref(false);
const suppliers = ref<any[]>([]);
const materials = ref<any[]>([]);
const currentShopId = useUserStoreHook()?.currentShopId ?? 0;
const purchaseDialogRef = ref();

// 明细弹窗
const itemsVisible = ref(false);
const itemsList = ref<any[]>([]);

const load = async () => {
  loading.value = true;
  try {
    const r = await getPurchaseOrderList({
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
  const r = await getMaterialList({
    page: 1,
    size: 999,
    category: "",
    type: ""
  });
  if (r?.success) materials.value = r.data.list;
};

const openAdd = () => {
  loadSuppliers();
  loadMaterials();
  dialogVisible.value = true;
  setTimeout(() => purchaseDialogRef.value?.resetForm(), 0);
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
          <el-select
            v-model="query.status"
            clearable
            placeholder="全部状态"
            style="width: 130px"
          >
            <el-option label="进行中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已取消" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button
            v-auth="'btn:purchaseOrder:add'"
            type="primary"
            @click="openAdd"
          >
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
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
      >
        <template #empty>
          <el-empty description="暂无采购单" :image-size="80" />
        </template>
        <el-table-column prop="order_number" label="单号" width="180" />
        <el-table-column prop="supplier_name" label="供应商" min-width="120" />
        <el-table-column
          prop="total_amount"
          label="总金额"
          width="100"
          align="right"
        />
        <el-table-column
          prop="paid_amount"
          label="已付"
          width="100"
          align="right"
        />
        <el-table-column label="结算" width="80" align="center">
          <template #default="{ row }">
            {{ row.type === 1 ? "现结" : "赊账" }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 1
                  ? 'warning'
                  : row.status === 2
                    ? 'success'
                    : 'info'
              "
              size="small"
            >
              {{ ["", "进行中", "已完成", "已取消"][row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openItems(row.id)"
              >明细</el-button
            >
            <el-button
              v-if="row.status === 1"
              link
              type="success"
              @click="updateStatus(row.id, 2)"
            >
              完成
            </el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="primary"
              @click="payOrder(row.id)"
            >
              付款
            </el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="danger"
              @click="updateStatus(row.id, 3)"
            >
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
    <PurchaseDialog
      ref="purchaseDialogRef"
      v-model:visible="dialogVisible"
      :suppliers="suppliers"
      :materials="materials"
      @success="load"
    />

    <!-- 采购明细弹窗 -->
    <ItemsDialog v-model:visible="itemsVisible" :items-list="itemsList" />
  </div>
</template>
