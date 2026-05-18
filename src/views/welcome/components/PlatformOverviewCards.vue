<script setup lang="ts">
import type { PlatformOverview, TopTenant } from "@/api/dashboard";
import StatCard from "./StatCard.vue";

defineProps<{
  overview: PlatformOverview;
  topTenants: TopTenant[];
  loading?: boolean;
}>();
</script>

<template>
  <div class="platform-overview">
    <div class="cards-row">
      <StatCard label="总商户" :value="overview?.totalTenants" color="#667eea" :loading="loading" />
      <StatCard label="封禁" :value="overview?.bannedTenants" color="#e74c3c" :loading="loading" />
      <StatCard label="总店铺" :value="overview?.totalShops" color="#2d8f5e" :loading="loading" />
      <StatCard label="生效席位" :value="overview?.activeSeats" color="#4facfe" :loading="loading" />
      <StatCard label="本月新商户" :value="overview?.newTenantsThisMonth" color="#f5576c" :loading="loading" />
      <StatCard label="本月新店铺" :value="overview?.newShopsThisMonth" color="#a18cd1" :loading="loading" />
    </div>
    <div class="cards-row">
      <StatCard label="总订阅收入" :value="overview?.totalRevenue" prefix="¥" color="#e74c3c" :loading="loading" />
      <StatCard label="本月收入" :value="overview?.revenueThisMonth" prefix="¥" color="#5b8def" :loading="loading" />
      <StatCard label="本年收入" :value="overview?.revenueThisYear" prefix="¥" color="#2d8f5e" :loading="loading" />
      <StatCard label="总退款" :value="overview?.totalRefund" prefix="¥" color="#e67e22" :loading="loading" />
      <StatCard label="席位使用率" :value="(overview?.seatUtilization || 0) * 100" suffix="%" color="#667eea" :loading="loading" />
      <StatCard label="平台顾客" :value="overview?.totalCustomers" color="#f093fb" :loading="loading" />
    </div>
    <div v-if="topTenants?.length" class="top-tenants">
      <span class="top-label">TOP 商户</span>
      <span v-for="(item, i) in topTenants" :key="item.tenant_id" class="top-item">
        <em class="top-rank">{{ i + 1 }}</em>
        {{ item.name }}
        <b class="top-rev">¥{{ Number(item.revenue || 0).toLocaleString() }}</b>
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.platform-overview {
  margin-bottom: 12px;
}

.cards-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 10px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.top-tenants {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  background: #fff;
  border-radius: 6px;
  flex-wrap: wrap;
}

.top-label {
  font-size: 12px;
  color: #999;
  font-weight: 600;
  margin-right: 4px;
}

.top-item {
  font-size: 13px;
  color: #555;
  white-space: nowrap;
}

.top-rank {
  display: inline-block;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: #bbb;
  margin-right: 4px;
  font-style: normal;
  vertical-align: middle;
}

.top-item:first-of-type .top-rank { background: #f6d365; }
.top-item:nth-of-type(2) .top-rank { background: #a1c4fd; }
.top-item:nth-of-type(3) .top-rank { background: #d4a5a5; }

.top-rev {
  color: #e74c3c;
  font-weight: 600;
  margin-left: 4px;
}
</style>
