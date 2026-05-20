<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { getSupplierList, deleteSupplier } from "@/api/inventory";
import SupplierDialog from "./components/SupplierDialog.vue";

defineOptions({ name: "InvSupplier" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({ keyword: "" });
const formVisible = ref(false);
const isEdit = ref(false);
const supplierDialogRef = ref();
const currentSupplier = ref<any>(null);

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
  currentSupplier.value = null;
  formVisible.value = true;
  setTimeout(() => supplierDialogRef.value?.initForm(), 0);
};

const openEdit = (row: any) => {
  isEdit.value = true;
  currentSupplier.value = row;
  formVisible.value = true;
  setTimeout(() => supplierDialogRef.value?.initForm(), 0);
};

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除该供应商吗？", "提示", {
      type: "warning"
    });
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
          <el-button
            v-auth="'btn:supplier:add'"
            type="primary"
            @click="openAdd"
          >
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
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
      >
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
            <el-button
              v-auth="'btn:supplier:edit'"
              link
              type="primary"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-auth="'btn:supplier:delete'"
              link
              type="danger"
              @click="handleDelete(row.id)"
            >
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

    <SupplierDialog
      ref="supplierDialogRef"
      v-model:visible="formVisible"
      :is-edit="isEdit"
      :supplier-data="currentSupplier"
      @success="load"
    />
  </div>
</template>
