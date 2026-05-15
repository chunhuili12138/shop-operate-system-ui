<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { http } from "@/utils/http";
import { message } from "@/utils/message";

defineOptions({ name: "TradePurchase" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({
  keyword: "",
  channel: "",
  status: "",
  startDate: "",
  endDate: ""
});

const dialogVisible = ref(false);
const customers = ref([]);
const packages = ref([]);
const form = reactive({
  customersId: "",
  packageId: "",
  channel: "store",
  paymentMethod: "",
  totalAmount: "",
  paidAmount: "",
  remark: ""
});

const loadCustomers = async () => {
  const r: any = await http.get("/customers/page", {
    params: { page: 1, size: 999 }
  });
  if (r?.success) customers.value = r.data.list;
};

const loadPkgs = async () => {
  const r: any = await http.get("/packages/page", {
    params: { page: 1, size: 999 }
  });
  if (r?.success) packages.value = r.data.list;
};

const load = async () => {
  loading.value = true;
  try {
    const r: any = await http.get("/purchases", {
      params: { page: page.value, size: size.value, ...query }
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
  query.keyword = "";
  query.channel = "";
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

const openAddDialog = async () => {
  await Promise.all([loadCustomers(), loadPkgs()]);
  dialogVisible.value = true;
};

const save = async () => {
  const r: any = await http.post("/purchasesAdd", { data: form });
  if (r?.success) {
    message("新增成功", { type: "success" });
    dialogVisible.value = false;
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const refund = async (id: number) => {
  const { value } = await import("element-plus").then(m =>
    m.ElMessageBox.prompt("请输入退款原因", "申请退款")
  );
  if (value) {
    const r: any = await http.post("/purchasesRefundsApply", {
      data: { purchaseId: id, reason: value }
    });
    if (r?.success) {
      message("退款申请已提交", { type: "success" });
      load();
    } else {
      message(r?.msg || "失败", { type: "warning" });
    }
  }
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <!-- 搜索/筛选区 -->
    <div class="page-header">
      <el-form :model="query" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="顾客/套餐名"
            style="width:180px"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="query.channel" clearable placeholder="全部" style="width:100px">
            <el-option label="门店" value="store" />
            <el-option label="美团" value="meituan" />
            <el-option label="抖音" value="douyin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width:100px">
            <el-option label="有效" :value="1" />
            <el-option label="已退款" :value="2" />
            <el-option label="已过期" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAddDialog">新增购买</el-button>
        </div>
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="tableData"
                style="width: 100%"
      >
        <el-table-column prop="customer_name" label="顾客" />
        <el-table-column prop="package_name" label="套餐" />
        <el-table-column prop="channel" label="渠道" width="80" align="center" />
        <el-table-column prop="total_amount" label="总金额" width="90" align="center" />
        <el-table-column prop="paid_amount" label="实付" width="90" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'info'"
              size="small"
            >
              {{ { 1: "有效", 2: "已退款", 3: "已过期" }[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              link
              type="danger"
              @click="refund(row.id)"
            >
              退款
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

    <!-- 新增购买弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增购买"
      width="500px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="顾客">
          <el-select v-model="form.customersId" filterable style="width:100%">
            <el-option
              v-for="c in customers"
              :key="c.id"
              :label="c.nickname + '(' + c.phone + ')'"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="form.packageId" style="width:100%">
            <el-option v-for="p in packages" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="form.channel" style="width:100%">
            <el-option label="门店" value="store" />
            <el-option label="美团" value="meituan" />
            <el-option label="抖音" value="douyin" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-input v-model="form.paymentMethod" />
        </el-form-item>
        <el-form-item label="总金额">
          <el-input v-model="form.totalAmount" />
        </el-form-item>
        <el-form-item label="实付">
          <el-input v-model="form.paidAmount" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
