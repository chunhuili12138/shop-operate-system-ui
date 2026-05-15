<script setup lang="ts">
import type { PlatformOverview, TopTenant } from "@/api/dashboard";
import StatCard from "./StatCard.vue";

defineProps<{
  overview: PlatformOverview;
  topTenants: TopTenant[];
  loading?: boolean;
}>();

const formatPercent = (v: number) => `${(v * 100).toFixed(1)}%`;
</script>

<template>
  <div class="platform-overview">
    <div class="section-title">平台核心指标</div>
    <el-row :gutter="16" class="cards-row">
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="总商户数"
          :value="overview?.totalTenants"
          icon="🏢"
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="var(--color-stat-blue)"
          :loading="loading"
        />
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="封禁商户"
          :value="overview?.bannedTenants"
          icon="🚫"
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          color="var(--color-stat-red)"
          :loading="loading"
        />
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="总店铺数"
          :value="overview?.totalShops"
          icon="🏪"
          gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          color="var(--color-stat-green)"
          :loading="loading"
        />
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="生效席位"
          :value="overview?.activeSeats"
          icon="💺"
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          color="var(--color-stat-orange)"
          :loading="loading"
        />
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="本月新增商户"
          :value="overview?.newTenantsThisMonth"
          icon="📈"
          gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          color="var(--color-stat-red)"
          :loading="loading"
        />
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="本月新增店铺"
          :value="overview?.newShopsThisMonth"
          icon="🏗️"
          gradient="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
          color="#a18cd1"
          :loading="loading"
        />
      </el-col>
    </el-row>

    <div class="section-title sub-title">财务概览</div>
    <el-row :gutter="16" class="cards-row">
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="总订阅收入"
          :value="overview?.totalRevenue"
          prefix="¥"
          icon="💰"
          gradient="linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
          color="#ff6b6b"
          :loading="loading"
        />
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="本月收入"
          :value="overview?.revenueThisMonth"
          prefix="¥"
          icon="💵"
          gradient="linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)"
          color="#5b8def"
          :loading="loading"
        />
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="本年收入"
          :value="overview?.revenueThisYear"
          prefix="¥"
          icon="🏦"
          gradient="linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)"
          color="#2d8f5e"
          :loading="loading"
        />
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="总退款"
          :value="overview?.totalRefund"
          prefix="¥"
          icon="↩️"
          gradient="linear-gradient(135deg, #f5576c 0%, #ffa07a 100%)"
          color="#e74c3c"
          :loading="loading"
        />
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="席位使用率"
          :value="(overview?.seatUtilization || 0) * 100"
          suffix="%"
          icon="📐"
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="#667eea"
          :loading="loading"
        />
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <StatCard
          label="总顾客数"
          :value="overview?.totalCustomers"
          icon="👥"
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          color="#f093fb"
          :loading="loading"
        />
      </el-col>
    </el-row>

    <div class="section-title sub-title">商户排行 TOP5</div>
    <div class="top-tenants">
      <div
        v-for="(item, index) in topTenants"
        :key="item.tenant_id"
        class="top-item"
      >
        <div class="top-rank" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
        <div class="top-name">{{ item.name }}</div>
        <div class="top-revenue">¥{{ Number(item.revenue || 0).toLocaleString() }}</div>
      </div>
      <el-empty v-if="!topTenants?.length" description="暂无数据" :image-size="60" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.platform-overview {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 4px solid var(--el-color-primary);

  &.sub-title {
    margin-top: 24px;
    font-size: 16px;
  }
}

.cards-row {
  .el-col {
    margin-bottom: 12px;
  }
}

.top-tenants {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-fill-color-light);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
}

.top-rank {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;

  &.rank-1 { background: linear-gradient(135deg, #f6d365, #fda085); }
  &.rank-2 { background: linear-gradient(135deg, #a1c4fd, #c2e9fb); }
  &.rank-3 { background: linear-gradient(135deg, #d4a5a5, #b8a9c9); }
  &.rank-4,
  &.rank-5 { background: var(--el-color-info); }
}

.top-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.top-revenue {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-color-danger);
  white-space: nowrap;
}
</style>
