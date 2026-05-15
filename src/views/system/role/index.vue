<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";
import {
  getRoleList,
  addRole,
  updateRole,
  setRolePermissions,
  getPermissionList
} from "@/api/system";

defineOptions({ name: "SystemRole" });

const tableData = ref([]);

// ---- 角色表单弹窗 ----
const formDialog = ref(false);
const formRef = ref<FormInstance>();
const isEdit = ref(false);
const form = reactive({ id: null as number | null, name: "", description: "" });

// ---- 权限设置弹窗 ----
const permDialog = ref(false);
const currentRole = ref<any>({});
const permTree = ref([]);
const checkedPerms = ref<number[]>([]);
const treeRef = ref();

const loadData = async () => {
  const r = await getRoleList();
  if (r?.success) tableData.value = r.data;
};

const openAdd = () => {
  isEdit.value = false;
  Object.assign(form, { id: null, name: "", description: "" });
  formDialog.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    name: row.name,
    description: row.description
  });
  formDialog.value = true;
};

const save = async () => {
  const r = isEdit.value 
    ? await updateRole(form)
    : await addRole(form);
  if (r?.success) {
    message("保存成功", { type: "success" });
    formDialog.value = false;
    loadData();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openPerms = async (role: any) => {
  currentRole.value = role;
  const [r1, r2] = await Promise.all([
    getPermissionList(),
    getRoleList()
  ]);
  if (r1?.success) permTree.value = r1.data;
  if (r2?.success) {
    const info = r2.data.find((x: any) => x.id === role.id);
    checkedPerms.value = info?.permissionIds || [];
  }
  permDialog.value = true;
};

const savePerms = async () => {
  const r = await setRolePermissions({
    roleId: currentRole.value.id,
    permissionIds: checkedPerms.value.join(",")
  });
  if (r?.success) {
    message("权限已保存", { type: "success" });
    permDialog.value = false;
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

onMounted(loadData);
</script>

<template>
  <div class="page-container">
    <!-- 操作区（无搜索，纯操作） -->
    <div class="page-header">
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">
            + 新增角色
          </el-button>
        </div>
        <div />
      </div>
    </div>

    <!-- 表格区 -->
    <div class="page-table">
      <el-table :data="tableData"  style="width: 100%">
        <el-table-column prop="name" label="角色名" width="180" />
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span :class="{ 'text-dim': !row.description }">
              {{ row.description || "暂无描述" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="perm_count" label="权限数" width="80" align="center" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">
              编辑
            </el-button>
            <el-button link type="primary" @click="openPerms(row)">
              设置权限
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 角色表单弹窗 -->
    <el-dialog
      v-model="formDialog"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="440px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" placeholder="请输入角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权限设置弹窗 -->
    <el-dialog
      v-model="permDialog"
      :title="'设置权限 - ' + currentRole.name"
      width="520px"
      class="dialog-md"
      :close-on-click-modal="false"
    >
      <el-tree
        ref="treeRef"
        :data="permTree"
        show-checkbox
        node-key="id"
        :props="{ label: 'name', children: 'children' }"
        :default-checked-keys="checkedPerms"
      />
      <template #footer>
        <el-button @click="permDialog = false">取消</el-button>
        <el-button type="primary" @click="savePerms">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
