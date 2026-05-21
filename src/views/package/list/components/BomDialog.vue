<script setup lang="ts">
defineProps<{
  visible: boolean;
  bomList: any[];
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

const handleClose = () => {
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="物料清单"
    width="500px"
    class="dialog-sm"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="bomList.length">
      <el-table :data="bomList" style="width: 100%">
        <el-table-column prop="material_name" label="物料" />
        <el-table-column prop="quantity" label="用量" width="80" />
        <el-table-column prop="unit" label="单位" width="80" />
      </el-table>
    </template>
    <template v-else>
      <el-empty description="暂无物料清单" :image-size="60" />
    </template>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>
