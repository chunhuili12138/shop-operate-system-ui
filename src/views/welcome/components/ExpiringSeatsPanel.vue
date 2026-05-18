<script setup lang="ts">
import type { ExpiringData } from "@/api/dashboard";

const props = defineProps<{ data: ExpiringData; loading?: boolean }>();

const getClass = (d: number) => (d <= 7 ? "danger" : d <= 30 ? "warning" : "info");
const getTag = (d: number) => (d <= 7 ? "紧急" : d <= 30 ? "临近" : "预警");
const getTagType = (d: number) => (d <= 7 ? "danger" : d <= 30 ? "warning" : "info") as "danger" | "warning" | "info";
</script>

<template>
  <el-card shadow="never" class="expiring-panel" v-loading="loading">
    <template #header>
      <span class="panel-title">席位到期预警</span>
    </template>

    <div v-if="props.data?.list?.length" class="expiring-body">
      <div class="expiring-summary">
        <span class="sum-item danger">{{ props.data.within7Days }}<em>7天</em></span>
        <span class="sum-item warning">{{ props.data.within30Days }}<em>30天</em></span>
        <span class="sum-item info">{{ props.data.within60Days }}<em>60天</em></span>
      </div>
      <div class="expiring-list">
        <div v-for="item in props.data.list" :key="item.id" class="expiring-row" :class="getClass(item.remaining_days)">
          <span class="row-name">{{ item.tenant_name }}</span>
          <span class="row-date">{{ item.end_date }}</span>
          <span class="row-days">{{ item.remaining_days }}天</span>
          <el-tag :type="getTagType(item.remaining_days)" size="small" effect="plain">{{ getTag(item.remaining_days) }}</el-tag>
        </div>
      </div>
    </div>
    <div v-else class="expiring-empty">暂无到期席位</div>
  </el-card>
</template>

<style scoped lang="scss">
.expiring-panel {
  border-radius: 6px;
  border: 1px solid #ebeef5;
  height: 100%;
  :deep(.el-card__header) { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; }
  :deep(.el-card__body) { padding: 0 14px 12px; }
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.expiring-body {
  display: flex;
  gap: 12px;
}

.expiring-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 60px;
}

.sum-item {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1.2;
  em {
    display: block;
    font-size: 10px;
    font-weight: 400;
    font-style: normal;
    margin-top: 1px;
  }
  &.danger { background: #fef0f0; color: #f56c6c; em { color: #f56c6c; } }
  &.warning { background: #fdf6ec; color: #e6a23c; em { color: #e6a23c; } }
  &.info { background: #f4f4f5; color: #909399; em { color: #909399; } }
}

.expiring-list {
  flex: 1;
  max-height: 200px;
  overflow-y: auto;
}

.expiring-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
  border-left: 2px solid transparent;
  &.danger { border-left-color: #f56c6c; background: #fef0f0; }
  &.warning { border-left-color: #e6a23c; background: #fdf6ec; }
  &.info { border-left-color: #909399; background: #f4f4f5; }
}

.row-name { font-weight: 500; color: #333; min-width: 80px; }
.row-date { color: #999; font-size: 12px; }
.row-days { color: #666; font-size: 12px; margin-left: 4px; font-weight: 500; }
.danger .row-days { color: #f56c6c; }
.warning .row-days { color: #e6a23c; }

.expiring-empty {
  text-align: center;
  padding: 24px;
  color: #999;
  font-size: 13px;
}
</style>
