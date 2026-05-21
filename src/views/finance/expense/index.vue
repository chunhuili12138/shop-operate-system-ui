<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { getExpenseList, getExpenseCategories, addExpense, updateExpense, deleteExpense, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from "@/api/finance";
import { getDictData } from "@/api/dict";

defineOptions({ name: "FinanceExpense" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const dialogVisible = ref(false);
const isEdit = ref(false);
const categories = ref<any[]>([]);
const paymentMethods = ref<any[]>([]);
const form = reactive({ expenseId: 0, categoryId: "", amount: "", paymentMethod: "", expenseDate: "", remark: "" });

// 分类管理
const catDialogVisible = ref(false);
const catForm = reactive({ catId: 0, name: "" });
const isEditCat = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const r = await getExpenseList({ page: page.value, size: size.value });
    if (r?.success) { tableData.value = r.data.list; total.value = r.data.total; }
  } finally { loading.value = false; }
};

const loadCats = async () => {
  const r = await getExpenseCategories();
  if (r?.success) categories.value = r.data || [];
};

const loadDicts = async () => {
  try {
    const r = await getDictData("payment_method");
    if (r?.success && Array.isArray(r.data)) paymentMethods.value = r.data;
  } catch { /* ignore */ }
};

const onSizeChange = (s: number) => { size.value = s; page.value = 1; load(); };

const openAdd = () => {
  isEdit.value = false;
  Object.assign(form, { expenseId: 0, categoryId: "", amount: "", paymentMethod: "", expenseDate: "", remark: "" });
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(form, {
    expenseId: row.id, categoryId: row.category_id, amount: row.amount,
    paymentMethod: row.payment_method, expenseDate: String(row.expense_date).substring(0, 10), remark: row.remark || ""
  });
  dialogVisible.value = true;
};

const save = async () => {
  const r = isEdit.value ? await updateExpense(form as any) : await addExpense(form as any);
  if (r?.success) { message(isEdit.value ? "更新成功" : "新增成功", { type: "success" }); dialogVisible.value = false; load(); }
  else message(r?.msg || "失败", { type: "warning" });
};

const onDelete = async (id: number) => {
  try { await ElMessageBox.confirm("确认删除？", "提示", { type: "warning" }); } catch { return; }
  const r = await deleteExpense(id);
  if (r?.success) { message("已删除", { type: "success" }); load(); }
  else message(r?.msg || "失败", { type: "warning" });
};

// 分类管理
const openAddCat = () => { isEditCat.value = false; catForm.name = ""; catDialogVisible.value = true; };
const openEditCat = (cat: any) => { isEditCat.value = true; catForm.catId = cat.id; catForm.name = cat.name; catDialogVisible.value = true; };
const saveCat = async () => {
  const r = isEditCat.value ? await updateExpenseCategory(catForm.catId, catForm.name) : await addExpenseCategory(catForm.name);
  if (r?.success) { message(isEditCat.value ? "更新成功" : "新增成功", { type: "success" }); catDialogVisible.value = false; loadCats(); }
  else message(r?.msg || "失败", { type: "warning" });
};
const onDeleteCat = async (id: number) => {
  try { await ElMessageBox.confirm("确认删除？", "提示", { type: "warning" }); } catch { return; }
  const r = await deleteExpenseCategory(id);
  if (r?.success) { message("已删除", { type: "success" }); loadCats(); }
  else message(r?.msg || "失败", { type: "warning" });
};

onMounted(() => { load(); loadCats(); loadDicts(); });
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">新增支出</el-button>
          <el-button @click="openAddCat">管理分类</el-button>
        </div>
        <div><el-button type="primary" @click="load">刷新</el-button></div>
      </div>
    </div>
    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" stripe style="width:100%">
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="amount" label="金额" width="100" />
        <el-table-column prop="payment_method" label="支付方式" width="100" />
        <el-table-column prop="expense_date" label="日期" width="120" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无支出记录" /></template>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="page" v-model:page-size="size" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination" @size-change="onSizeChange" @current-change="load"
    />

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑支出' : '新增支出'" width="500px" :close-on-click-modal="false">
      <el-form :model="form" label-width="80px">
        <el-form-item label="分类" required>
          <el-select v-model="form.categoryId" style="width:100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" required>
          <el-input v-model="form.amount" placeholder="0.00" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="form.paymentMethod" style="width:100%">
            <el-option v-for="m in paymentMethods" :key="m.dict_label" :label="m.dict_value" :value="m.dict_label" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" required>
          <el-date-picker v-model="form.expenseDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
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

    <el-dialog v-model="catDialogVisible" :title="isEditCat ? '编辑分类' : '新增分类'" width="400px" :close-on-click-modal="false">
      <el-form :model="catForm" label-width="80px">
        <el-form-item label="分类名称" required>
          <el-input v-model="catForm.name" />
        </el-form-item>
      </el-form>
      <el-table :data="categories" size="small" style="margin-top:12px">
        <el-table-column prop="name" label="已有分类" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditCat(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="onDeleteCat(row.id)">删除</el-button>
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
