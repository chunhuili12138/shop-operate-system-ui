<script setup lang="ts">
defineProps<{
  label: string;
  value?: string | number;
  prefix?: string;
  suffix?: string;
  color?: string;
  loading?: boolean;
}>();

const formatValue = (
  val?: string | number,
  prefix?: string,
  suffix?: string
) => {
  if (val === null || val === undefined || val === "") return "-";
  let display = String(val);
  if (typeof val === "number" && !Number.isInteger(val)) {
    display = val.toFixed(2);
  }
  return `${prefix || ""}${display}${suffix || ""}`;
};
</script>

<template>
  <div
    class="stat-card"
    :style="{ borderLeftColor: color || 'var(--el-color-primary)' }"
  >
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value" :style="{ color }">
      <el-skeleton
        v-if="loading"
        style="width: 60px; height: 22px"
        :rows="1"
        animated
      />
      <template v-else>{{ formatValue(value, prefix, suffix) }}</template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stat-card {
  padding: 10px 14px;
  background: #fff;
  border-left: 3px solid var(--el-color-primary);
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
    transform: translateY(-1px);
  }
}

.stat-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
</style>
