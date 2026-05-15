<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import {
  getTenantList,
  deleteTenant,
  updateTenantBanStatus
} from "@/api/tenant";
import ResetPasswordDialog from "@/views/tenant/list/components/ResetPasswordDialog.vue";
import SeatDialog from "@/views/tenant/list/components/SeatDialog.vue";
import TenantFormDialog from "@/views/tenant/list/components/TenantFormDialog.vue";
import TransactionDialog from "@/views/tenant/list/components/TransactionDialog.vue";

defineOptions({ name: "TenantList" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "", banStatus: "" as any });

// ---- 席位 ----
const seatDialogVisible = ref(false);
const currentStaffId = ref(0);
const seatDialogRef = ref();

// ---- 流水 ----
const txDialogVisible = ref(false);
const txDialogRef = ref();

// ---- 商户表单 ----
const formDialogVisible = ref(false);
const isEdit = ref(false);
const currentFormData = ref(null);
const formDialogRef = ref();

// ---- 重置密码 ----
const pwdDialogVisible = ref(false);
const pwdStaffId = ref(0);

const load = async () => {
  loading.value = true;
  try {
    const r = await getTenantList({
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
  query.keyword = "";
  query.banStatus = "";
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
  currentFormData.value = null;
  formDialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  currentFormData.value = {
    staffId: row.id,
    name: row.name,
    phone: row.phone,
    username: "",
    password: "",
    maxSeats: null,
    remark: row.remark
  };
  formDialogVisible.value = true;
};

const openResetPwd = (id: number) => {
  pwdStaffId.value = id;
  pwdDialogVisible.value = true;
};

const openSeat = (id: number) => {
  currentStaffId.value = id;
  seatDialogVisible.value = true;
  setTimeout(() => {
    seatDialogRef.value?.openSeat();
  }, 100);
};

const openTx = (id: number) => {
  currentStaffId.value = id;
  txDialogVisible.value = true;
  setTimeout(() => {
    txDialogRef.value?.openTx();
  }, 100);
};

const doDelete = async (id: number) => {
  await import("element-plus").then(m =>
    m.ElMessageBox.confirm("确认删除？", "提示")
  );
  const r = await deleteTenant(id);
  if (r?.success) {
    message("已删除", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const toggleBan = async (id: number, isBan: number) => {
  const r = await updateTenantBanStatus({
    staffId: id,
    banStatus: isBan ? 0 : 1
  });
  if (r?.success) {
    message("操作成功", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

onMounted(() => {
  load();
});
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
            style="width: 200px"
            placeholder="商户名称/手机号"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="封禁状态">
          <el-select
            v-model="query.banStatus"
            clearable
            style="width: 150px"
            placeholder="全部"
          >
            <el-option label="正常" :value="0" />
            <el-option label="封禁" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">新增商户</el-button>
        </div>
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="商户名称" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="席位数" width="120">
          <template #default="{ row }">
            {{ row.used_seats || 0 }} / {{ row.max_seats || 0 }}
          </template>
        </el-table-column>
        <el-table-column
          prop="shop_count"
          label="店铺数"
          width="70"
          align="center"
        />
        <el-table-column prop="role_names" label="角色" width="120">
          <template #default="{ row }">
            <span class="text-sm text-dim">{{ row.role_names || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_ban ? 'danger' : 'success'" size="small">
              {{ row.is_ban ? "封禁" : "正常" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button link type="primary" @click="openSeat(row.id)"
              >席位</el-button
            >
            <el-button link type="primary" @click="openTx(row.id)"
              >流水</el-button
            >
            <el-button link type="primary" @click="openResetPwd(row.id)"
              >重置密码</el-button
            >
            <el-button
              link
              :type="row.is_ban ? 'success' : 'warning'"
              @click="toggleBan(row.id, row.is_ban)"
            >
              {{ row.is_ban ? "解封" : "封禁" }}
            </el-button>
            <el-button link type="danger" @click="doDelete(row.id)">
              删除
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

    <!-- 席位管理弹窗 -->
    <SeatDialog
      ref="seatDialogRef"
      v-model:visible="seatDialogVisible"
      :staff-id="currentStaffId"
    />

    <!-- 流水弹窗 -->
    <TransactionDialog
      ref="txDialogRef"
      v-model:visible="txDialogVisible"
      :staff-id="currentStaffId"
    />

    <!-- 商户表单弹窗 -->
    <TenantFormDialog
      ref="formDialogRef"
      v-model:visible="formDialogVisible"
      :is-edit="isEdit"
      :form-data="currentFormData"
      @success="load"
    />

    <!-- 重置密码 -->
    <ResetPasswordDialog
      v-model:visible="pwdDialogVisible"
      :staff-id="pwdStaffId"
    />
  </div>
</template>
