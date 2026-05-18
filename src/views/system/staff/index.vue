<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import {
  getStaffList,
  updateStaff,
  updateStaffStatus,
  deleteStaff,
  getRoleList
} from "@/api/system";
import StaffFormDialog from "./components/StaffFormDialog.vue";
import ResetPasswordDialog from "./components/ResetPasswordDialog.vue";

defineOptions({ name: "SystemStaff" });

const loading = ref(false);
const tableData = ref([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);

const roles = ref<{ id: number; name: string }[]>([]);

const query = reactive({
  keyword: "",
  roleId: "" as any,
  status: "" as any
});

// ---- 员工表单弹窗 ----
const dialogVisible = ref(false);
const dialogTitle = ref("");
const isEdit = ref(false);
const currentStaffData = ref(null);

// ---- 重置密码弹窗 ----
const pwdDialogVisible = ref(false);
const pwdStaffId = ref(0);

const loadData = async () => {
  loading.value = true;
  try {
    const res = await getStaffList({
      page: page.value,
      size: size.value,
      ...query
    });
    if (res?.success) {
      tableData.value = res.data.list;
      total.value = res.data.total;
    } else {
      message(res?.msg || "加载失败", { type: "error" });
    }
  } catch (error) {
    console.error("加载员工列表失败:", error);
    message("加载失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.keyword = "";
  query.roleId = "";
  query.status = "";
  page.value = 1;
  loadData();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  loadData();
};

const loadOptions = async () => {
  try {
    const r = await getRoleList();
    if (r?.success) roles.value = r.data;
  } catch (error) {
    console.error("加载角色列表失败:", error);
  }
};

const openAdd = () => {
  isEdit.value = false;
  dialogTitle.value = "新增员工";
  currentStaffData.value = null;
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  dialogTitle.value = "编辑员工";
  currentStaffData.value = row;
  dialogVisible.value = true;
};

const handleFormSuccess = () => {
  loadData();
};

const openResetPwd = (staffId: number) => {
  pwdStaffId.value = staffId;
  pwdDialogVisible.value = true;
};

const doDelete = async (staffId: number) => {
  try {
    await ElMessageBox.confirm(
      "删除后该员工将无法登录系统，是否确认？",
      "提示"
    );
    const res = await deleteStaff(staffId);
    if (res?.success) {
      message("已删除", { type: "success" });
      await loadData();
    } else {
      message(res?.msg || "失败", { type: "warning" });
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      message("删除失败", { type: "error" });
    }
  }
};

const toggleStatus = async (row: any) => {
  try {
    const newStatus = row.status === 1 ? 0 : 1;
    const label = newStatus === 0 ? "设为离职" : "设为在职";
    await ElMessageBox.confirm(`确认${label}？`, "提示");
    const res = await updateStaffStatus({ staffId: row.id, status: newStatus });
    if (res?.success) {
      message("操作成功", { type: "success" });
      await loadData();
    } else {
      message(res?.msg || "失败", { type: "warning" });
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("切换状态失败:", error);
      message("操作失败", { type: "error" });
    }
  }
};

onMounted(() => {
  loadData();
  loadOptions();
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
            placeholder="姓名/手机号"
            clearable
            style="width: 180px"
            @keyup.enter="loadData"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="query.roleId"
            placeholder="全部"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="r in roles"
              :key="r.id"
              :label="r.name"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 100px"
          >
            <el-option label="在职" :value="1" />
            <el-option label="离职" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">新增员工</el-button>
        </div>
        <div>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" min-width="140">
          <template #default="{ row }">
            <span class="text-sm text-dim">{{ row.role_names || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用工类型" width="80" align="center">
          <template #default="{ row }">
            {{ row.employment_type === 1 ? "全职" : "兼职" }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? "在职" : "离职" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button link type="primary" @click="openResetPwd(row.id)">
              重置密码
            </el-button>
            <el-button
              link
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? "设为离职" : "设为在职" }}
            </el-button>
            <el-button link type="danger" @click="doDelete(row.id)"
              >删除</el-button
            >
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
      @current-change="loadData"
    />

    <!-- 员工表单弹窗 -->
    <StaffFormDialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :is-edit="isEdit"
      :staff-data="currentStaffData"
      @success="handleFormSuccess"
    />

    <!-- 重置密码弹窗 -->
    <ResetPasswordDialog
      v-model:visible="pwdDialogVisible"
      :staff-id="pwdStaffId"
      @success="loadData"
    />
  </div>
</template>
