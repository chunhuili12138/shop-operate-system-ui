<script setup lang="ts">
import type { SubscriptionDistribution } from "@/api/dashboard";

const props = defineProps<{ data: SubscriptionDistribution }>();

const fmt = (v: number) =>
  v >= 10000
    ? `¥${(v / 10000).toFixed(1)}万`
    : `¥${Number(v).toLocaleString()}`;
</script>

<template>
  <div class="sub-detail">
    <div class="sub-item monthly">
      <span class="sub-tag">月付</span>
      <span class="sub-num">{{ props.data?.monthlyCount ?? 0 }} 笔</span>
      <span class="sub-amt">{{ fmt(props.data?.monthlyRevenue || 0) }}</span>
    </div>
    <div class="sub-item yearly">
      <span class="sub-tag">年付</span>
      <span class="sub-num">{{ props.data?.yearlyCount ?? 0 }} 笔</span>
      <span class="sub-amt">{{ fmt(props.data?.yearlyRevenue || 0) }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sub-detail {
  display: flex;
  gap: 8px;
}

.sub-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: #fafafa;
  border-radius: 4px;

  &.monthly {
    border-left: 2px solid #667eea;
  }

  &.yearly {
    border-left: 2px solid #4facfe;
  }
}

.sub-tag {
  font-size: 11px;
  font-weight: 600;

  .monthly & {
    color: #667eea;
  }

  .yearly & {
    color: #4facfe;
  }
}

.sub-num {
  font-size: 15px;
  font-weight: 700;
  color: #333;
}

.sub-amt {
  font-size: 13px;
  font-weight: 600;
  color: #e74c3c;
}
</style>
