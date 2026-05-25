<script setup lang="ts">
import { ref } from "vue";
import { getInventoryTransactions } from "@/api/inventory";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
}>();

const txList = ref<any[]>([]);
const txMaterialName = ref("");

// 查看库存流水
const open = async (materialId: string, materialName: string) => {
  txMaterialName.value = materialName;
  const r = await getInventoryTransactions({
    materialId,
    page: 1,
    size: 50
  });
  if (r?.success) txList.value = r.data.list;
};

const handleClose = () => {
  emit("update:visible", false);
};

defineExpose({ open });
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="'库存流水 - ' + txMaterialName"
    width="600px"
    class="dialog-md"
    @close="handleClose"
  >
    <template v-if="txList.length">
      <el-table :data="txList" size="small" style="width: 100%">
        <el-table-column label="类型" width="70">
          <template #default="{ row }">
            <el-tag
              :type="row.transaction_type === 1 ? 'success' : 'warning'"
              size="small"
            >
              {{ row.transaction_type === 1 ? "入库" : "出库" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="quantity"
          label="数量"
          width="80"
          align="center"
        />
        <el-table-column
          prop="balance_after"
          label="变更后"
          width="80"
          align="center"
        />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="created_at" label="时间" width="170" />
      </el-table>
    </template>
    <template v-else>
      <el-empty description="暂无流水记录" :image-size="60" />
    </template>
  </el-dialog>
</template>
