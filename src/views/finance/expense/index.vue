<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import {
  getExpenseList,
  getExpenseSummary,
  getExpenseCategories,
  addExpense,
  updateExpense,
  deleteExpense,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory
} from "@/api/finance";
import { getDictData } from "@/api/dict";

defineOptions({ name: "FinanceExpense" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({
  dateRange: [] as string[],
  categoryId: "" as any,
  amountMin: undefined as number | undefined,
  amountMax: undefined as number | undefined
});
const summary = reactive({
  totalExpense: 0,
  totalCount: 0,
  categories: [] as any[]
});
const dialogVisible = ref(false);
const isEdit = ref(false);
const categories = ref<any[]>([]);
const paymentMethods = ref<any[]>([]);
const form = reactive({
  expenseId: 0,
  categoryId: "",
  amount: "",
  paymentMethod: "",
  expenseDate: "",
  remark: ""
});

const catDialogVisible = ref(false);
const catForm = reactive({ catId: 0, name: "" });
const isEditCat = ref(false);

const sourceLabel = (val: string) => {
  const item = paymentMethods.value.find((d: any) => d.dict_label === val);
  return item ? item.dict_value : val || "-";
};

const loadSummary = async () => {
  const params: any = {};
  if (query.dateRange?.length === 2) {
    params.startDate = query.dateRange[0];
    params.endDate = query.dateRange[1];
  }
  if (query.categoryId) params.categoryId = query.categoryId;
  if (query.amountMin !== undefined) params.amountMin = query.amountMin;
  if (query.amountMax !== undefined) params.amountMax = query.amountMax;
  const r = await getExpenseSummary(params);
  if (r?.success) Object.assign(summary, r.data);
};

const load = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, size: size.value };
    if (query.dateRange?.length === 2) {
      params.startDate = query.dateRange[0];
      params.endDate = query.dateRange[1];
    }
    if (query.categoryId) params.categoryId = query.categoryId;
    if (query.amountMin !== undefined) params.amountMin = query.amountMin;
    if (query.amountMax !== undefined) params.amountMax = query.amountMax;
    const r = await getExpenseList(params);
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
  loadSummary();
};
const onReset = () => {
  query.dateRange = [];
  query.categoryId = "";
  query.amountMin = undefined;
  query.amountMax = undefined;
  page.value = 1;
  load();
  loadSummary();
};

const loadCats = async () => {
  const r = await getExpenseCategories();
  if (r?.success) categories.value = r.data || [];
};

const loadDicts = async () => {
  try {
    const r = await getDictData("payment_method");
    if (r?.success && Array.isArray(r.data)) paymentMethods.value = r.data;
  } catch {
    /* ignore */
  }
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const openAdd = () => {
  isEdit.value = false;
  Object.assign(form, {
    expenseId: 0,
    categoryId: "",
    amount: "",
    paymentMethod: "",
    expenseDate: "",
    remark: ""
  });
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(form, {
    expenseId: row.id,
    categoryId: row.category_id,
    amount: row.amount,
    paymentMethod: row.payment_method,
    expenseDate: String(row.expense_date).substring(0, 10),
    remark: row.remark || ""
  });
  dialogVisible.value = true;
};

const save = async () => {
  const r = isEdit.value
    ? await updateExpense(form as any)
    : await addExpense(form as any);
  if (r?.success) {
    message(isEdit.value ? "更新成功" : "新增成功", { type: "success" });
    dialogVisible.value = false;
    load();
    loadSummary();
  } else message(r?.msg || "失败", { type: "warning" });
};

const onDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除？", "提示", { type: "warning" });
  } catch {
    return;
  }
  const r = await deleteExpense(id);
  if (r?.success) {
    message("已删除", { type: "success" });
    load();
    loadSummary();
  } else message(r?.msg || "失败", { type: "warning" });
};

const openAddCat = () => {
  isEditCat.value = false;
  catForm.name = "";
  catDialogVisible.value = true;
};
const openEditCat = (cat: any) => {
  isEditCat.value = true;
  catForm.catId = cat.id;
  catForm.name = cat.name;
  catDialogVisible.value = true;
};
const saveCat = async () => {
  const r = isEditCat.value
    ? await updateExpenseCategory(catForm.catId, catForm.name)
    : await addExpenseCategory(catForm.name);
  if (r?.success) {
    message(isEditCat.value ? "更新成功" : "新增成功", { type: "success" });
    catDialogVisible.value = false;
    await loadCats();
  } else message(r?.msg || "失败", { type: "warning" });
};
const onDeleteCat = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除？", "提示", { type: "warning" });
  } catch {
    return;
  }
  const r = await deleteExpenseCategory(id);
  if (r?.success) {
    message("已删除", { type: "success" });
    await loadCats();
  } else message(r?.msg || "失败", { type: "warning" });
};

onMounted(() => {
  load();
  loadSummary();
  loadCats();
  loadDicts();
});
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline class="page-search">
        <el-form-item label="日期范围">
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
        <el-form-item label="分类">
          <el-select
            v-model="query.categoryId"
            clearable
            placeholder="全部分类"
            style="width: 160px"
            @change="onSearch"
          >
            <el-option
              v-for="c in categories"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number
            v-model="query.amountMin"
            :min="0"
            placeholder="最低"
            style="width: 150px"
            @change="onSearch"
          />
          <span style="margin: 0 6px; color: #999">-</span>
          <el-input-number
            v-model="query.amountMax"
            :min="0"
            placeholder="最高"
            style="width: 150px"
            @change="onSearch"
          />
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">新增支出</el-button>
          <el-button @click="openAddCat">管理分类</el-button>
        </div>
        <div>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </div>
      </div>
    </div>

    <el-row :gutter="16" class="summary-row">
      <el-col :span="8">
        <el-card shadow="never">
          <div class="text-sm text-dim">总支出</div>
          <div class="text-2xl font-bold" style="color: var(--el-color-danger)">
            ¥{{ summary.totalExpense ?? 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <div class="text-sm text-dim">记录数</div>
          <div class="text-2xl font-bold" style="color: #667eea">
            {{ summary.totalCount ?? 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <div class="text-dim">分类TOP3</div>
          <div
            v-if="summary.categories?.length"
            class="flex gap-3.5"
            style="line-height: 1.8"
          >
            <div
              v-for="(cat, i) in summary.categories.slice(0, 3)"
              :key="i"
              style="color: #666"
            >
              {{ cat.name }}: ¥{{ Number(cat.total).toFixed(0) }}
            </div>
          </div>
          <div v-else class="text-dim text-sm">-</div>
        </el-card>
      </el-col>
    </el-row>

    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column label="金额" width="130" align="center">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="支付方式" width="120" align="center">
          <template #default="{ row }">{{
            sourceLabel(row.payment_method)
          }}</template>
        </el-table-column>
        <el-table-column prop="expense_date" label="日期" width="170" />
        <el-table-column
          prop="remark"
          label="备注"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column prop="operator_name" label="操作人" width="100" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.source_type === 'manual'"
              link
              type="primary"
              size="small"
              @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button
              v-if="row.source_type === 'manual'"
              link
              type="danger"
              size="small"
              @click="onDelete(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无支出记录" /></template>
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

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑支出' : '新增支出'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="分类" required>
          <el-select v-model="form.categoryId" style="width: 100%">
            <el-option
              v-for="c in categories"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" required>
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            placeholder="0.00"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="form.paymentMethod" style="width: 100%">
            <el-option
              v-for="m in paymentMethods"
              :key="m.dict_label"
              :label="m.dict_value"
              :value="m.dict_label"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" required>
          <el-date-picker
            v-model="form.expenseDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="catDialogVisible"
      :title="isEditCat ? '编辑分类' : '新增分类'"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="catForm" label-width="80px">
        <el-form-item label="分类名称" required>
          <el-input v-model="catForm.name" />
        </el-form-item>
      </el-form>
      <el-table :data="categories" size="small" style="margin-top: 12px">
        <el-table-column prop="name" label="已有分类" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="openEditCat(row)"
              >编辑</el-button
            >
            <el-button
              link
              type="danger"
              size="small"
              @click="onDeleteCat(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="catDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="saveCat">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.summary-row {
  margin-bottom: 16px;
}
.summary-row .el-card {
  border: 1px solid var(--el-border-color-light);
}
.summary-row :deep(.el-card__body) {
  padding: 16px;
}
</style>
