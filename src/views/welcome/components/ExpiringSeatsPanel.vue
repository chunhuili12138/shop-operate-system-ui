<script setup lang="ts">
import type { ExpiringData } from "@/api/dashboard";

defineProps<{
  data: ExpiringData;
  loading?: boolean;
}>();

const getUrgencyClass = (days: number) => {
  if (days <= 7) return "danger";
  if (days <= 30) return "warning";
  return "info";
};

const getUrgencyLabel = (days: number) => {
  if (days <= 7) return "紧急";
  if (days <= 30) return "临近";
  return "预警";
};
</script>

<template>
  <el-card shadow="hover" class="expiring-panel" v-loading="loading">
    <template #header>
      <div class="panel-header">
        <span class="header-icon">⏰</span>
        <span class="header-title">席位到期预警</span>
      </div>
    </template>

    <div class="expiring-summary">
      <div class="summary-item danger">
        <span class="summary-count">{{ data?.within7Days ?? 0 }}</span>
        <span class="summary-label">7日内到期</span>
      </div>
      <div class="summary-item warning">
        <span class="summary-count">{{ data?.within30Days ?? 0 }}</span>
        <span class="summary-label">30日内到期</span>
      </div>
      <div class="summary-item info">
        <span class="summary-count">{{ data?.within60Days ?? 0 }}</span>
        <span class="summary-label">60日内到期</span>
      </div>
    </div>

    <div v-if="data?.list?.length" class="expiring-list">
      <div
        v-for="item in data.list"
        :key="item.id"
        class="expiring-item"
        :class="getUrgencyClass(item.remaining_days)"
      >
        <div class="expiring-dot" />
        <div class="expiring-info">
          <div class="tenant-name">{{ item.tenant_name }}</div>
          <div class="expire-meta">
            <span class="expire-date">{{ item.end_date }}</span>
            <span class="expire-gap">剩余 {{ item.remaining_days }} 天</span>
          </div>
        </div>
        <el-tag
          :type="getUrgencyClass(item.remaining_days) === 'danger' ? 'danger' : getUrgencyClass(item.remaining_days) === 'warning' ? 'warning' : 'info'"
          size="small"
          effect="plain"
        >
          {{ getUrgencyLabel(item.remaining_days) }}
        </el-tag>
      </div>
    </div>
    <el-empty v-else description="暂无到期席位" :image-size="80" />
  </el-card>
</template>

<style scoped lang="scss">
.expiring-panel {
  border-radius: 12px;
  border: none;
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.15);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .header-icon {
    font-size: 20px;
  }
  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.expiring-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.summary-item {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);

  &.danger {
    background: var(--el-color-danger-light-9);
    .summary-count { color: var(--el-color-danger); }
  }
  &.warning {
    background: var(--el-color-warning-light-9);
    .summary-count { color: var(--el-color-warning); }
  }
  &.info {
    background: var(--el-color-info-light-9);
    .summary-count { color: var(--el-color-info); }
  }
}

.summary-count {
  display: block;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.expiring-list {
  max-height: 360px;
  overflow-y: auto;
}

.expiring-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  border-left: 3px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-fill-color-light);
    transform: translateX(4px);
  }

  &.danger {
    border-left-color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }
  &.warning {
    border-left-color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }
  &.info {
    border-left-color: var(--el-color-info);
  }
}

.expiring-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-danger);
  flex-shrink: 0;
  animation: pulse 2s infinite;

  .warning & { background: var(--el-color-warning); }
  .info & { background: var(--el-color-info); animation: none; }
}

.expiring-info {
  flex: 1;
  min-width: 0;
}

.tenant-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.expire-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .expire-date {
    color: var(--el-color-danger);
    font-weight: 500;
  }
  .expire-gap {
    color: var(--el-text-color-secondary);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}
</style>
