<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { message } from "@/utils/message";
import type { FormInstance, FormRules } from "element-plus";
import {
  getDictList,
  addDict,
  updateDict,
  deleteDict
} from "@/api/system";

defineOptions({ name: "SystemDict" });

const dictCodes = ref<string[]>([]);
const currentCode = ref("");
const tableData = ref([]);
const loading = ref(false);

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  id: null as number | null,
  dictCode: "",
  dictKey: null as number | null,
  dictValue: "",
  dictLabel: "",
  sort: 0
});
const isEdit = ref(false);

const rules: FormRules = {
  dictCode: [{ required: true, message: "请输入字典编码", trigger: "blur" }],
  dictKey: [{ required: true, message: "请输入Key", trigger: "blur" }],
  dictValue: [{ required: true, message: "请输入Value", trigger: "blur" }],
  dictLabel: [{ required: true, message: "请输入Label", trigger: "blur" }]
};

const loadCodes = async () => {
  const r = await getDictList({ page: 1, size: 999 });
  if (r?.success) {
    const codes = new Set<string>();
    r.data.list.forEach((x: any) => codes.add(x.dict_code));
    dictCodes.value = Array.from(codes);
  }
};

const loadData = async () => {
  if (!currentCode.value) return;
  loading.value = true;
  try {
    const r = await getDictList({
      page: 1,
      size: 999,
      dictCode: currentCode.value
    });
    if (r?.success) tableData.value = r.data.list;
  } finally {
    loading.value = false;
  }
};

watch(currentCode, loadData);

const openAdd = () => {
  isEdit.value = false;
  Object.assign(form, {
    id: null,
    dictCode: currentCode.value,
    dictKey: null,
    dictValue: "",
    dictLabel: "",
    sort: 0
  });
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    dictCode: row.dict_code,
    dictKey: row.dict_key,
    dictValue: row.dict_value,
    dictLabel: row.dict_label,
    sort: row.sort
  });
  dialogVisible.value = true;
};

const save = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (!valid) return;

    const r = isEdit.value
      ? await updateDict(form)
      : await addDict(form);
    if (r?.success) {
      message("保存成功", { type: "success" });
      dialogVisible.value = false;
      loadData();
      loadCodes();
    } else {
      message(r?.msg || "失败", { type: "warning" });
    }
  });
};

const doDelete = async (id: number) => {
  await import("element-plus").then(m =>
    m.ElMessageBox.confirm("确认删除?", "提示")
  );
  const r = await deleteDict(id);
  if (r?.success) {
    message("已删除", { type: "success" });
    loadData();
    loadCodes();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

onMounted(loadCodes);
</script>

<template>
  <div class="page-container page-split">
    <!-- 左侧字典编码列表 -->
    <div class="page-split-sidebar">
      <div class="page-card">
        <div
          class="text-sm font-medium px-4 py-3 border-b border-[var(--ad-border)] flex-shrink-0"
        >
          字典编码
        </div>
        <div class="flex-1 scroll-style" style="overflow: auto">
          <el-menu
            :default-active="currentCode"
            class="border-none!"
            @select="(i: string) => (currentCode = i)"
          >
            <el-menu-item v-for="c in dictCodes" :key="c" :index="c">
              {{ c }}
            </el-menu-item>
          </el-menu>
        </div>
      </div>
    </div>

    <!-- 右侧字典项 -->
    <div class="page-split-main">
      <div class="page-header">
        <div class="flex-bc">
          <span class="text-sm font-medium">字典项 - {{ currentCode }}</span>
          <div class="flex gap-2">
            <el-button
              type="primary"
              size="small"
              :disabled="!currentCode"
              @click="openAdd"
            >
              新增
            </el-button>
          </div>
        </div>
      </div>
      <div class="page-table">
        <el-table v-loading="loading" :data="tableData" style="width: 100%">
          <el-table-column
            prop="dict_key"
            label="Key"
            width="80"
            align="center"
          />
          <el-table-column prop="dict_value" label="值" min-width="120" />
          <el-table-column prop="dict_label" label="标签" min-width="120" />
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.is_active === 1 ? 'success' : 'info'"
                size="small"
              >
                {{ row.is_active === 1 ? "启用" : "禁用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="170" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)"
                >编辑</el-button
              >
              <el-button link type="danger" @click="doDelete(row.id)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑字典项' : '新增字典项'"
      width="440px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="编码" prop="dictCode">
          <el-input v-model="form.dictCode" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="Key" prop="dictKey">
          <el-input-number v-model="form.dictKey" style="width: 100%" />
        </el-form-item>
        <el-form-item label="值" prop="dictValue">
          <el-input v-model="form.dictValue" placeholder="显示的值" />
        </el-form-item>
        <el-form-item label="标签" prop="dictLabel">
          <el-input v-model="form.dictLabel" placeholder="标识符" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container {
  height: 100%;
}
.page-split-sidebar {
  height: 100%;
  overflow: hidden;
}
.page-card {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
