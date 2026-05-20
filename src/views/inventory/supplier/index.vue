<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  getSupplierList,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  type SupplierFormParams
} from "@/api/inventory";

defineOptions({ name: "InvSupplier" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({ keyword: "" });
const formRef = ref<FormInstance>();
const formVisible = ref(false);
const isEdit = ref(false);
const formLoading = ref(false);
const form = reactive<SupplierFormParams>({
  supplierId: null,
  name: "",
  contactPerson: "",
  phone: "",
  address: "",
  remark: ""
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入供应商名称", trigger: "blur" }],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号格式", trigger: "blur" }
  ]
};

const load = async () => {
  loading.value = true;
  try {
    const r = await getSupplierList(page.value, size.value);
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
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const openAdd = () => {
  isEdit.value = false;
  Object.assign(form, { supplierId: null, name: "", contactPerson: "", phone: "", address: "", remark: "" });
  formVisible.value = true;
  setTimeout(() => formRef.value?.clearValidate(), 0);
};

const openEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(form, {
    supplierId: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    phone: row.phone,
    address: row.address,
    remark: row.remark
  });
  formVisible.value = true;
  setTimeout(() => formRef.value?.clearValidate(), 0);
};

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除该供应商吗？", "提示", { type: "warning" });
  } catch {
    return;
  }
  const r = await deleteSupplier(id);
  if (r?.success) {
    message("删除成功", { type: "success" });
    load();
  } else {
    message(r?.msg || "删除失败", { type: "warning" });
  }
};

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  formLoading.value = true;
  try {
    const api = isEdit.value ? updateSupplier : addSupplier;
    const r = await api(form);
    if (r?.success) {
      message(isEdit.value ? "编辑成功" : "新增成功", { type: "success" });
      formVisible.value = false;
      load();
    } else {
      message(r?.msg || "操作失败", { type: "warning" });
    }
  } finally {
    formLoading.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline class="page-search">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="搜索名称/联系人"
            clearable
            style="width: 220px"
            @keyup.enter="load"
          />
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" v-auth="'btn:supplier:add'" @click="openAdd">
            新增供应商
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
          <el-empty description="暂无供应商" :image-size="80" />
        </template>
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="address" label="地址" min-width="180" />
        <el-table-column prop="remark" label="备注" min-width="140" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" v-auth="'btn:supplier:edit'" @click="openEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" v-auth="'btn:supplier:delete'" @click="handleDelete(row.id)">
              删除
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

    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑供应商' : '新增供应商'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入供应商名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactPerson" placeholder="请输入联系人" maxlength="30" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" maxlength="100" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
