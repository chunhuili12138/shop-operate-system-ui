<script setup lang="ts">
defineProps<{
  visible: boolean;
  warnList: any[];
}>();

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
}>();
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="库存预警"
    width="520px"
    class="dialog-md"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="warnList.length">
      <div class="flex flex-col gap-2">
        <div
          v-for="w in warnList"
          :key="w.id"
          class="flex items-center justify-between px-3 py-2 rounded-md text-sm"
          style="background: rgba(248, 81, 73, 0.06)"
        >
          <span>{{ w.material_name }}</span>
          <span class="text-xs text-dim">
            库存 {{ w.quantity }} {{ w.unit }} / 预警值 {{ w.min_stock }}
          </span>
        </div>
      </div>
    </template>
    <template v-else>
      <el-empty description="暂无库存预警" :image-size="60" />
    </template>
  </el-dialog>
</template>
