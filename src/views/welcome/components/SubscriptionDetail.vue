<script setup lang="ts">
import type { SubscriptionDistribution } from "@/api/dashboard";

defineProps<{
  data: SubscriptionDistribution;
  loading?: boolean;
}>();

const formatMoney = (v: number) => {
  if (v >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
  return `¥${Number(v).toLocaleString()}`;
};
</script>

<template>
  <el-card shadow="hover" class="sub-detail-panel" v-loading="loading">
    <template #header>
      <div class="panel-header">
        <span class="header-icon">📊</span>
        <span class="header-title">订阅营收明细</span>
      </div>
    </template>

    <div class="detail-grid">
      <div class="detail-card monthly">
        <div class="detail-tag">月付</div>
        <div class="detail-count">{{ data?.monthlyCount ?? 0 }} 笔</div>
        <div class="detail-amount">{{ formatMoney(data?.monthlyRevenue || 0) }}</div>
      </div>
      <div class="detail-card yearly">
        <div class="detail-tag">年付</div>
        <div class="detail-count">{{ data?.yearlyCount ?? 0 }} 笔</div>
        <div class="detail-amount">{{ formatMoney(data?.yearlyRevenue || 0) }}</div>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.sub-detail-panel {
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
  .header-icon { font-size: 20px; }
  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-card {
  padding: 16px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);

  &.monthly {
    border-left: 3px solid var(--el-color-primary);
  }
  &.yearly {
    border-left: 3px solid var(--el-color-success);
  }
}

.detail-tag {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;

  .yearly & {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }
}

.detail-count {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.detail-amount {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-danger);
}
</style>
