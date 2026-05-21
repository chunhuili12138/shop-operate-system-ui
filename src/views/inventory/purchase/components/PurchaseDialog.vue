<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { addPurchaseOrder } from "@/api/inventory";
import { message } from "@/utils/message";

interface Props {
  visible: boolean;
  suppliers: any[];
  materials: any[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const formRef = ref<FormInstance>();
const formLoading = ref(false);

const form = reactive({
  supplierId: "",
  orderDate: "",
  type: 1,
  remark: "",
  items: [] as any[]
});

const rules: FormRules = {
  supplierId: [{ required: true, message: "请选择供应商", trigger: "change" }],
  orderDate: [{ required: true, message: "请选择日期", trigger: "change" }]
};

const addItem = () => {
  form.items.push({ materialId: "", quantity: 1, unitPrice: 0 });
};

const removeItem = (i: number) => {
  form.items.splice(i, 1);
};

// 物料选中时自动填充单价
const onMaterialChange = (idx: number, materialId: string) => {
  const m = props.materials.find((t: any) => String(t.id) === materialId);
  // 暂不从后端取价格，保留手动填写
};

const save = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.items.length === 0) {
    message("请至少添加一项采购明细", { type: "warning" });
    return;
  }
  for (const item of form.items) {
    if (!item.materialId) {
      message("请为每项明细选择物料", { type: "warning" });
      return;
    }
  }
  formLoading.value = true;
  try {
    const r = await addPurchaseOrder({
      supplierId: form.supplierId,
      orderDate: form.orderDate,
      type: form.type,
      remark: form.remark,
      items: JSON.stringify(form.items)
    } as any);
    if (r?.success) {
      message("采购单已创建", { type: "success" });
      emit("update:visible", false);
      emit("success");
    } else {
      message(r?.msg || "创建失败", { type: "warning" });
    }
  } finally {
    formLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, {
    supplierId: "",
    orderDate: "",
    type: 1,
    remark: "",
    items: []
  });
  formRef.value?.clearValidate();
};

defineExpose({
  resetForm
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="新增采购单"
    width="800px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="供应商" prop="supplierId">
            <el-select
              v-model="form.supplierId"
              placeholder="请选择供应商"
              style="width: 100%"
            >
              <template v-if="suppliers.length === 0">
                <el-empty description="暂无供应商，请先添加" :image-size="40" />
              </template>
              <el-option
                v-for="s in suppliers"
                :key="s.id"
                :label="s.name"
                :value="s.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="日期" prop="orderDate">
            <el-date-picker
              v-model="form.orderDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="结算方式">
        <el-radio-group v-model="form.type">
          <el-radio :value="1">现结</el-radio>
          <el-radio :value="2">赊账</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="采购明细">
        <div style="">
          <div class="flex items-center justify-between mb-3">
            <el-button type="primary" size="small" @click="addItem"
              >+ 添加物料</el-button
            >
            <span class="text-xs" style="color: #909399; margin-left: 5px"
              >至少添加一项</span
            >
          </div>
          <div
            v-if="form.items.length === 0"
            class="text-center py-4"
            style="color: #909399; font-size: 13px"
          >
            暂无明细，请点击“添加物料”
          </div>
        </div>
        <div v-if="form.items.length !== 0" class="purchase-items-container">
          <div
            v-for="(item, i) in form.items"
            :key="i"
            class="purchase-item-row"
          >
            <div class="item-index">{{ i + 1 }}</div>
            <div class="item-content">
              <div class="item-field">
                <span class="field-label">物料</span>
                <el-select
                  v-model="item.materialId"
                  placeholder="选择物料"
                  filterable
                  class="field-input"
                  @change="onMaterialChange(i, item.materialId)"
                >
                  <el-option
                    v-for="m in materials"
                    :key="m.id"
                    :label="`${m.name} (${m.sku || '-'})`"
                    :value="String(m.id)"
                  />
                </el-select>
              </div>
              <div class="item-fields-row">
                <div class="item-field">
                  <span class="field-label">数量</span>
                  <el-input-number
                    v-model="item.quantity"
                    :min="1"
                    class="field-input"
                  />
                </div>
                <div class="item-field">
                  <span class="field-label">单价</span>
                  <el-input-number
                    v-model="item.unitPrice"
                    :min="0"
                    :precision="2"
                    class="field-input"
                  />
                </div>
              </div>
            </div>
            <el-button
              type="danger"
              size="small"
              plain
              class="item-delete-btn"
              @click="removeItem(i)"
            >
              删除
            </el-button>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="选填备注"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="save"
        >保存</el-button
      >
    </template>
  </el-dialog>
</template>

<style scoped>
.purchase-items-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.purchase-item-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.purchase-item-row:hover {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.item-index {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
  margin-top: 2px;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-fields-row {
  display: flex;
  gap: 16px;
}

.item-fields-row .item-field {
  flex: 1;
}

.field-label {
  font-size: 13px;
  color: #606266;
  min-width: 40px;
  text-align: right;
}

.field-input {
  flex: 1;
}

.item-delete-btn {
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
