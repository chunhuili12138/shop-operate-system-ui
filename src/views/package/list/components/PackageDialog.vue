<script setup lang="ts">
import { reactive, watch } from "vue";

interface BomItem {
  materialId: string;
  quantity: number;
}

interface FormModel {
  packageId: number | null;
  name: string;
  type: number;
  durationMinutes: number | null;
  price: string;
  maxPeoplePerSession: number;
  description: string;
  bom: BomItem[];
}

const props = defineProps<{
  visible: boolean;
  isEdit: boolean;
  formData?: FormModel;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "save"): void;
}>();

const form = reactive<FormModel>({
  packageId: null,
  name: "",
  type: 1,
  durationMinutes: null,
  price: "",
  maxPeoplePerSession: 1,
  description: "",
  bom: []
});

// 监听外部数据变化，同步到内部表单
watch(
  () => props.formData,
  newData => {
    if (newData) {
      Object.assign(form, newData);
    }
  },
  { deep: true }
);

const handleClose = () => {
  emit("update:visible", false);
};

const handleSave = () => {
  emit("save");
};

const addBomRow = () => {
  form.bom.push({ materialId: "", quantity: 1 });
};

const removeBomRow = (index: number) => {
  form.bom.splice(index, 1);
};

// 暴露表单数据给父组件
defineExpose({
  form
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑套餐' : '新增套餐'"
    width="600px"
    class="dialog-md"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form :model="form" label-width="120px">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" style="width: 100%">
          <el-option label="单次" :value="1" />
          <el-option label="周卡" :value="2" />
          <el-option label="月卡" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="时长(分)">
        <el-input-number v-model="form.durationMinutes" style="width: 100%" />
      </el-form-item>
      <el-form-item label="价格">
        <el-input v-model="form.price" />
      </el-form-item>
      <el-form-item label="最大人数">
        <el-input-number
          v-model="form.maxPeoplePerSession"
          :min="1"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="物料清单">
        <div class="flex-bc mb-2">
          <span class="text-sm text-dim">关联物料及用量</span>
          <el-button size="small" @click="addBomRow">+ 添加物料</el-button>
        </div>
        <div
          v-for="(b, i) in form.bom"
          :key="i"
          class="flex gap-2 mt-1 items-center"
        >
          <el-input
            v-model="b.materialId"
            placeholder="物料ID"
            style="width: 140px"
          />
          <el-input-number v-model="b.quantity" :min="1" style="width: 100px" />
          <el-button size="small" type="danger" plain @click="removeBomRow(i)">
            删除
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>
