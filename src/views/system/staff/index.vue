<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { http } from "@/utils/http";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";

defineOptions({ name: "SystemStaff" });

const loading = ref(false);
const tableData = ref([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);

const roles = ref<{ id: number; name: string }[]>([]);
const shops = ref<{ id: number; name: string }[]>([]);

const query = reactive({
  keyword: "",
  roleId: "" as any,
  status: "" as any
});

// ---- 员工表单弹窗 ----
const dialogVisible = ref(false);
const dialogTitle = ref("");
const isEdit = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  staffId: null as any,
  name: "",
  phone: "",
  username: "",
  password: "",
  roleIds: [] as number[],
  shopId: "" as any,
  employmentType: 1,
  remark: ""
});

// ---- 重置密码弹窗 ----
const pwdDialog = ref(false);
const pwdStaffId = ref(0);
const newPwd = ref("");

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await http.get("/staff/page", {
      params: { page: page.value, size: size.value, ...query }
    });
    if (res?.success) {
      tableData.value = res.data.list;
      total.value = res.data.total;
    }
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
  const [r, s]: any = await Promise.all([
    http.get("/roles/list"),
    http.get("/shops/page", { params: { page: 1, size: 999, status: 1 } })
  ]);
  if (r?.success) roles.value = r.data;
  if (s?.success) shops.value = s.data.list;
};

const openAdd = () => {
  isEdit.value = false;
  dialogTitle.value = "新增员工";
  Object.assign(form, {
    staffId: null,
    name: "",
    phone: "",
    username: "",
    password: "",
    roleIds: [],
    shopId: "",
    employmentType: 1,
    remark: ""
  });
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  dialogTitle.value = "编辑员工";
  Object.assign(form, {
    staffId: row.id,
    name: row.name,
    phone: row.phone,
    username: "",
    password: "",
    roleIds: [],
    shopId: row.shop_id,
    employmentType: row.employment_type,
    remark: row.remark
  });
  dialogVisible.value = true;
};

const save = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  const url = isEdit.value ? "/staff/update" : "/staff/add";
  const method = isEdit.value ? "put" : "post";
  const res: any = await http.request(method, url, { data: form });
  if (res?.success) {
    message("操作成功", { type: "success" });
    dialogVisible.value = false;
    loadData();
  } else {
    message(res?.msg || "操作失败", { type: "warning" });
  }
};

const openResetPwd = (staffId: number) => {
  pwdStaffId.value = staffId;
  newPwd.value = "";
  pwdDialog.value = true;
};

const doResetPwd = async () => {
  if (!pwdStaffId.value) return;
  const { value } = await import("element-plus").then(m =>
    m.ElMessageBox.prompt("请输入新密码", "重置密码")
  );
  if (value) {
    const res: any = await http.put("/staff/password", {
      data: { staffId: pwdStaffId.value, newPassword: value }
    });
    if (res?.success) {
      message("密码已重置", { type: "success" });
      pwdDialog.value = false;
      loadData();
    } else {
      message(res?.msg || "失败", { type: "warning" });
    }
  }
};

const doDelete = async (staffId: number) => {
  await import("element-plus").then(m =>
    m.ElMessageBox.confirm("确认删除？", "提示")
  );
  const res: any = await http.delete("/staff/delete", {
    params: { staffId }
  });
  if (res?.success) {
    message("已删除", { type: "success" });
    loadData();
  } else {
    message(res?.msg || "失败", { type: "warning" });
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
            style="width:180px"
            @keyup.enter="loadData"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="query.roleId"
            placeholder="全部"
            clearable
            style="width:130px"
          >
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width:100px"
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
      <el-table
        v-loading="loading"
        :data="tableData"
                style="width: 100%"
      >
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" width="140">
          <template #default="{ row }">
            <span class="text-sm text-dim">{{ row.role_names || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用工类型" width="80" align="center">
          <template #default="{ row }">
            {{ row.employment_type === 1 ? "全职" : "兼职" }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? "在职" : "离职" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openResetPwd(row.id)">
              重置密码
            </el-button>
            <el-button link type="danger" @click="doDelete(row.id)">删除</el-button>
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
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item
          label="姓名"
          prop="name"
          :rules="[{ required: true, message: '必填' }]"
        >
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item
          v-if="!isEdit"
          label="用户名"
          prop="username"
          :rules="[{ required: true, message: '必填' }]"
        >
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item
          v-if="!isEdit"
          label="密码"
          prop="password"
          :rules="[{ required: true, message: '必填' }]"
        >
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="form.roleIds" multiple style="width:100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属店铺" prop="shopId">
          <el-select v-model="form.shopId" placeholder="仅可选一个店铺" style="width:100%">
            <el-option v-for="s in shops" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="用工类型">
          <el-radio-group v-model="form.employmentType">
            <el-radio :value="1">全职</el-radio>
            <el-radio :value="2">兼职</el-radio>
          </el-radio-group>
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

    <!-- 重置密码弹窗 -->
    <el-dialog
      v-model="pwdDialog"
      title="重置密码"
      width="400px"
      class="dialog-xs"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="新密码">
          <el-input v-model="newPwd" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialog = false">取消</el-button>
        <el-button type="primary" @click="doResetPwd">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>
