<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";
import type { MaterialFormParams } from "@/api/inventory";
import { addMaterial, updateMaterial } from "@/api/inventory";
import { getDictData } from "@/api/system";

const props = defineProps<{
  visible: boolean;
  isEdit: boolean;
  formData?: MaterialFormParams | null;
  shopId: number;
}>();

const emit = defineEmits(["update:visible", "success"]);

const formRef = ref<FormInstance>();

const categoryOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);

// 表单验证规则
const rules = {
  name: [{ required: true, message: "请输入物料名称", trigger: "blur" }],
  sku: [{ required: true, message: "请输入SKU", trigger: "blur" }],
  minStock: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value !== null && value !== undefined && value < 0) {
          callback(new Error("最低库存不能小于0"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

const form = reactive<MaterialFormParams>({
  materialId: null,
  name: "",
  sku: "",
  category: "",
  unit: "个",
  type: 1,
  minStock: 20,
  remark: ""
});

// 监听 props.formData 变化，自动同步表单数据
watch(
  () => props.formData,
  newData => {
    if (newData) {
      Object.assign(form, newData);
    } else {
      // 重置表单
      Object.assign(form, {
        materialId: null,
        name: "",
        sku: "",
        category: "",
        unit: "个",
        type: 1,
        minStock: 20,
        remark: ""
      });
    }
  },
  { immediate: true }
);

// 监听对话框打开，确保新增时重置表单
watch(
  () => props.visible,
  newVal => {
    if (newVal && !props.isEdit) {
      // 新增模式：重置表单
      Object.assign(form, {
        materialId: null,
        name: "",
        sku: "",
        category: "",
        unit: "个",
        type: 1,
        minStock: 20,
        remark: ""
      });
      formRef.value?.clearValidate();
    }
  }
);

const loadCategories = async () => {
  const r = await getDictData({
    dictCode: "material_category",
    shopId: props.shopId
  } as any);
  if (r?.success && Array.isArray(r.data)) categoryOptions.value = r.data;
};

const reloadCategories = async () => {
  const r = await getDictData({
    dictCode: "material_category",
    shopId: props.shopId
  } as any);
  if (r?.success && Array.isArray(r.data)) categoryOptions.value = r.data;
};

loadCategories();

const save = async () => {
  // 表单验证
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch (error) {
    return;
  }

  const res = props.isEdit
    ? await updateMaterial(form)
    : await addMaterial(form);

  if (res?.success) {
    message(props.isEdit ? "编辑成功" : "新增成功", { type: "success" });
    emit("update:visible", false);
    emit("success");
  } else {
    message(res?.msg || "操作失败", { type: "warning" });
  }
};

const handleClose = () => {
  emit("update:visible", false);
};

defineExpose({ reloadCategories });
</script>

<template>
  <div>
    <el-dialog
      :model-value="visible"
      :title="isEdit ? '编辑物料' : '新增物料'"
      width="500px"
      class="dialog-sm"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="SKU" prop="sku">
          <el-input v-model="form.sku" placeholder="请输入SKU" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="form.category"
            placeholder="请选择或输入分类"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option
              v-for="c in categoryOptions"
              :key="c.dict_key"
              :label="c.dict_value"
              :value="c.dict_value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="单位">
          <el-select
            v-model="form.unit"
            placeholder="请选择或输入单位"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option label="个" value="个" />
            <el-option label="件" value="件" />
            <el-option label="箱" value="箱" />
            <el-option label="包" value="包" />
            <el-option label="瓶" value="瓶" />
            <el-option label="袋" value="袋" />
            <el-option label="盒" value="盒" />
            <el-option label="桶" value="桶" />
            <el-option label="千克" value="千克" />
            <el-option label="克" value="克" />
            <el-option label="米" value="米" />
            <el-option label="升" value="升" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio :value="1">消耗品</el-radio>
            <el-radio :value="2">工具</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="最低库存" prop="minStock">
          <el-input-number
            v-model="form.minStock"
            :min="0"
            placeholder="请输入最低库存"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
