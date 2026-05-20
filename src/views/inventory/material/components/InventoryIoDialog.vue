<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "@/utils/message";
import type { InventoryIoParams } from "@/api/inventory";
import { inventoryInbound, inventoryOutbound } from "@/api/inventory";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "success"): void;
}>();

const ioType = ref(1);
const currentStock = ref(0);
const ioForm = reactive<InventoryIoParams & { materialName?: string }>({
  materialId: "",
  quantity: 1,
  remark: "",
  materialName: ""
});

// 打开出入库弹窗
const open = (type: number, materialId: string, materialName: string, stock: number) => {
  ioType.value = type;
  currentStock.value = stock;
  ioForm.materialId = materialId;
  ioForm.materialName = materialName;
  ioForm.quantity = 1;
  ioForm.remark = "";
};

// 执行出入库
const doIo = async () => {
  if (!ioForm.quantity || Number(ioForm.quantity) <= 0) {
    message("请输入有效数量", { type: "warning" });
    return;
  }
  if (ioType.value === 2 && ioForm.quantity > currentStock.value) {
    message(`出库数量不能大于当前库存(${currentStock.value})`, { type: "warning" });
    return;
  }
  const fn = ioType.value === 1 ? inventoryInbound : inventoryOutbound;
  const r = await fn(ioForm);
  if (r?.success) {
    message(ioType.value === 1 ? "入库成功" : "出库成功", { type: "success" });
    emit("update:visible", false);
    emit("success");
  } else {
    message(r?.msg || "操作失败", { type: "warning" });
  }
};

const handleClose = () => {
  emit("update:visible", false);
};

defineExpose({ open });
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="ioType === 1 ? '入库' : '出库'"
    width="440px"
    class="dialog-sm"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="ioForm" label-width="80px">
      <el-form-item label="物料">
        <el-input :model-value="ioForm.materialName" disabled />
      </el-form-item>
      <el-form-item v-if="ioType === 2" label="当前库存">
        <span class="text-sm">{{ currentStock }}</span>
      </el-form-item>
      <el-form-item label="数量" required>
        <el-input-number
          v-model="ioForm.quantity"
          :min="1"
          :max="ioType === 2 ? currentStock : undefined"
          placeholder="请输入数量"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="ioForm.remark" placeholder="可选备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="doIo">确认</el-button>
    </template>
  </el-dialog>
</template>
