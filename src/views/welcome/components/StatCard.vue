<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  icon?: string;
  gradient: string;
  color: string;
  loading?: boolean;
}>();

const formatValue = (val: string | number, prefix?: string, suffix?: string) => {
  if (val === null || val === undefined || val === "") return "-";
  let display = String(val);
  if (typeof val === "number" && !Number.isInteger(val)) {
    display = val.toFixed(2);
  }
  return `${prefix || ""}${display}${suffix || ""}`;
};
</script>

<template>
  <el-card shadow="hover" class="stat-card">
    <div class="stat-content">
      <div class="stat-icon" :style="{ background: gradient }">
        {{ icon }}
      </div>
      <div class="stat-info">
        <div class="stat-label">{{ label }}</div>
        <div class="stat-value" :style="{ color }">
          <el-skeleton v-if="loading" style="width: 80px" :rows="1" animated />
          <template v-else>
            {{ formatValue(value, prefix, suffix) }}
          </template>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.stat-card {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
  .stat-value {
    font-size: 24px;
  }
}
</style>
