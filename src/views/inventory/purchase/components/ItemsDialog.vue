<script setup lang="ts">
interface Props {
  visible: boolean;
  itemsList: any[];
}

defineProps<Props>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="采购明细"
    width="500px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template v-if="itemsList.length">
      <el-table :data="itemsList" stripe size="small">
        <el-table-column prop="material_name" label="物料" min-width="140" />
        <el-table-column
          prop="quantity"
          label="数量"
          width="80"
          align="center"
        />
        <el-table-column
          prop="unit_price"
          label="单价"
          width="100"
          align="right"
        />
        <el-table-column label="小计" width="100" align="right">
          <template #default="{ row }">
            {{ ((row.quantity || 0) * (row.unit_price || 0)).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </template>
    <template v-else>
      <el-empty description="暂无明细" :image-size="60" />
    </template>
  </el-dialog>
</template>
