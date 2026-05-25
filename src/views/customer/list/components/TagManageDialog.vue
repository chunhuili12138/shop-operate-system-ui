<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import type { FormInstance } from "element-plus";
import { getDictData, addDict, updateDict, deleteDict } from "@/api/system";

const props = defineProps<{
  visible: boolean;
  shopId: number;
}>();

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "refresh"): void;
}>();

const tableData = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const form = ref({
  id: null as number | null,
  dictLabel: "",
  dictValue: ""
});

const loadData = async () => {
  loading.value = true;
  try {
    const r = await getDictData({
      dictCode: "customer_tag",
      shopId: props.shopId
    });
    if (r?.success) {
      const allTags = r.data || [];
      // 优先展示本店标签，后台 GET /system/dict/data 已按 shop_id=0 OR shop_id=?
      // 此处按 shop_id 排序：本店在前，全局在后
      allTags.sort((a: any, b: any) => {
        if (a.shop_id === props.shopId && b.shop_id !== props.shopId) return -1;
        if (b.shop_id === props.shopId && a.shop_id !== props.shopId) return 1;
        return a.sort - b.sort;
      });
      tableData.value = allTags;
    }
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  v => {
    if (v) loadData();
  }
);

const openAdd = () => {
  isEdit.value = false;
  form.value = { id: null, dictLabel: "", dictValue: "" };
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  form.value = {
    id: row.id,
    dictLabel: row.dict_label,
    dictValue: row.dict_value
  };
  dialogVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确认删除标签"${row.dict_value}"？`, "提示", {
      type: "warning"
    });
  } catch {
    return;
  }
  const r = await deleteDict(row.id);
  if (r?.success) {
    message("已删除", { type: "success" });
    loadData();
    emit("refresh");
  } else {
    message(r?.msg || "删除失败", { type: "warning" });
  }
};

const handleSave = async () => {
  const { id, dictLabel, dictValue } = form.value;
  if (!dictLabel.trim() || !dictValue.trim()) {
    message("编码和名称不能为空", { type: "warning" });
    return;
  }
  // 前端校验同 dict_code + shop_id 下不重复
  const dup = tableData.value.find(
    (t: any) =>
      t.id !== id &&
      (t.dict_label === dictLabel.trim() || t.dict_value === dictValue.trim())
  );
  if (dup) {
    if (dup.dict_label === dictLabel.trim())
      message("该编码已存在", { type: "warning" });
    else message("该名称已存在", { type: "warning" });
    return;
  }
  let r: any;
  if (isEdit.value) {
    r = await updateDict({
      id: id!,
      dictLabel: dictLabel.trim(),
      dictValue: dictValue.trim()
    } as any);
  } else {
    const maxKey =
      tableData.value.length > 0
        ? Math.max(...tableData.value.map((t: any) => t.dict_key))
        : 0;
    r = await addDict({
      dictCode: "customer_tag",
      dictKey: maxKey + 1,
      dictValue: dictValue.trim(),
      dictLabel: dictLabel.trim(),
      sort: maxKey + 1,
      shopId: props.shopId
    } as any);
  }
  if (r?.success) {
    message(isEdit.value ? "已更新" : "已添加", { type: "success" });
    dialogVisible.value = false;
    loadData();
    emit("refresh");
  } else {
    message(r?.msg || "操作失败", { type: "warning" });
  }
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="标签管理"
    width="550px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="mb-3">
      <el-button type="primary" size="small" @click="openAdd"
        >+ 新增标签</el-button
      >
    </div>
    <el-table
      v-loading="loading"
      :data="tableData"
      size="small"
      max-height="400"
    >
      <template #empty>
        <el-empty description="暂无标签" :image-size="60" />
      </template>
      <el-table-column prop="dict_label" label="编码" width="140" />
      <el-table-column prop="dict_value" label="名称" min-width="120" />
      <el-table-column label="来源" width="80">
        <template #default="{ row }">
          <el-tag size="small" :type="row.shop_id === 0 ? 'info' : 'success'">
            {{ row.shop_id === 0 ? "全局" : "本店" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button
            v-if="row.shop_id !== 0"
            link
            type="primary"
            size="small"
            @click="openEdit(row)"
            >编辑</el-button
          >
          <span
            v-else
            class="text-xs"
            style="color: var(--el-text-color-placeholder)"
            >全局</span
          >
          <el-button
            v-if="row.shop_id !== 0"
            link
            type="danger"
            size="small"
            @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      :model-value="dialogVisible"
      :title="isEdit ? '编辑标签' : '新增标签'"
      width="400px"
      append-to-body
      @update:model-value="dialogVisible = $event"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="编码">
          <el-input
            v-model="form.dictLabel"
            placeholder="如 vip"
            maxlength="30"
          />
        </el-form-item>
        <el-form-item label="名称">
          <el-input
            v-model="form.dictValue"
            placeholder="如 VIP"
            maxlength="30"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>
