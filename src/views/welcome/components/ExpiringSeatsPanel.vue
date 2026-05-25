<script setup lang="ts">
import type { ExpiringData } from "@/api/dashboard";

const props = defineProps<{ data: ExpiringData; loading?: boolean }>();

const getClass = (d: number) =>
  d <= 7 ? "danger" : d <= 30 ? "warning" : "info";
const getTag = (d: number) => (d <= 7 ? "紧急" : d <= 30 ? "临近" : "预警");
const getTagType = (d: number) =>
  (d <= 7 ? "danger" : d <= 30 ? "warning" : "info") as
    | "danger"
    | "warning"
    | "info";
</script>

<template>
  <el-card v-loading="loading" shadow="never" class="expiring-panel">
    <template #header>
      <span class="panel-title">席位到期预警</span>
    </template>

    <div v-if="props.data?.list?.length" class="expiring-body">
      <div class="expiring-summary">
        <span class="sum-item danger"
          >{{ props.data.within7Days }}<em>7天</em></span
        >
        <span class="sum-item warning"
          >{{ props.data.within30Days }}<em>30天</em></span
        >
        <span class="sum-item info"
          >{{ props.data.within60Days }}<em>60天</em></span
        >
      </div>
      <div class="expiring-list">
        <div
          v-for="item in props.data.list"
          :key="item.id"
          class="expiring-row"
          :class="getClass(item.remaining_days)"
        >
          <span class="row-name">{{ item.tenant_name }}</span>
          <span class="row-date">{{ item.end_date }}</span>
          <span class="row-days">{{ item.remaining_days }}天</span>
          <el-tag
            :type="getTagType(item.remaining_days)"
            size="small"
            effect="plain"
            >{{ getTag(item.remaining_days) }}</el-tag
          >
        </div>
      </div>
    </div>
    <div v-else class="expiring-empty">暂无到期席位</div>
  </el-card>
</template>

<style scoped lang="scss">
.expiring-panel {
  height: 100%;
  border: 1px solid #ebeef5;
  border-radius: 6px;

  :deep(.el-card__header) {
    padding: 10px 14px;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.el-card__body) {
    padding: 0 14px 12px;
  }
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
  padding: 4px 8px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  border-radius: 4px;

  em {
    display: block;
    margin-top: 1px;
    font-size: 10px;
    font-style: normal;
    font-weight: 400;
  }

  &.danger {
    color: #f56c6c;
    background: #fef0f0;

    em {
      color: #f56c6c;
    }
  }

  &.warning {
    color: #e6a23c;
    background: #fdf6ec;

    em {
      color: #e6a23c;
    }
  }

  &.info {
    color: #909399;
    background: #f4f4f5;

    em {
      color: #909399;
    }
  }
}

.expiring-list {
  flex: 1;
  max-height: 200px;
  overflow-y: auto;
}

.expiring-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  margin-bottom: 4px;
  font-size: 13px;
  border-left: 2px solid transparent;
  border-radius: 4px;

  &.danger {
    background: #fef0f0;
    border-left-color: #f56c6c;
  }

  &.warning {
    background: #fdf6ec;
    border-left-color: #e6a23c;
  }

  &.info {
    background: #f4f4f5;
    border-left-color: #909399;
  }
}

.row-name {
  min-width: 80px;
  font-weight: 500;
  color: #333;
}

.row-date {
  font-size: 12px;
  color: #999;
}

.row-days {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.danger .row-days {
  color: #f56c6c;
}

.warning .row-days {
  color: #e6a23c;
}

.expiring-empty {
  padding: 24px;
  font-size: 13px;
  color: #999;
  text-align: center;
}
</style>
