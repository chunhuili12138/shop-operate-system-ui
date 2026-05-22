<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useUserStoreHook } from "@/store/modules/user";
import { getDashboardToday, type PlatformDashboardData, type ShopDashboardData } from "@/api/dashboard";
import StatCard from "./components/StatCard.vue";
import PlatformOverviewCards from "./components/PlatformOverviewCards.vue";
import RevenueTrendChart from "./components/RevenueTrendChart.vue";
import TenantGrowthChart from "./components/TenantGrowthChart.vue";
import ShopGrowthChart from "./components/ShopGrowthChart.vue";
import ExpiringSeatsPanel from "./components/ExpiringSeatsPanel.vue";
import SubscriptionPieChart from "./components/SubscriptionPieChart.vue";
import SubscriptionDetail from "./components/SubscriptionDetail.vue";

defineOptions({ name: "Welcome" });

const loading = ref(true);
const isSuper = useUserStoreHook().superAdmin;
const isPlatform = ref(isSuper.value);

const platformData = ref<PlatformDashboardData | null>(null);
const shopStats = ref<ShopDashboardData>({});

const shopCards = computed(() => [
  { label: "今日收现", key: "todaySales", prefix: "¥", color: "#667eea" },
  { label: "今日确认收入", key: "todayRevenue", prefix: "¥", color: "#43e97b" },
  { label: "今日订单", key: "todayOrders", color: "#f5576c" },
  { label: "今日核销", key: "todayCheckins", color: "#4facfe" },
  { label: "新顾客数", key: "todayNewCustomers", color: "#f093fb" }
]);

const load = async () => {
  loading.value = true;
  try {
    const r = await getDashboardToday();
    if (r?.success) {
      if (r.data?.overview) {
        isPlatform.value = true;
        platformData.value = r.data as PlatformDashboardData;
      } else {
        isPlatform.value = false;
        shopStats.value = (r.data as ShopDashboardData) || {};
      }
    }
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2 class="dash-title">
        {{ isPlatform ? "平台数据总览" : "店铺数据中心" }}
      </h2>
    </div>

    <!-- 超管首页 -->
    <template v-if="isPlatform">
      <PlatformOverviewCards
        :overview="platformData?.overview"
        :top-tenants="platformData?.topTenants"
        :loading="loading"
      />

      <div class="charts-row">
        <div class="chart-box">
          <div class="chart-label">订阅收入趋势</div>
          <RevenueTrendChart :data="platformData?.trends?.revenue || []" />
        </div>
        <div class="chart-box">
          <div class="chart-label">新增商户趋势</div>
          <TenantGrowthChart :data="platformData?.trends?.tenants || []" />
        </div>
        <div class="chart-box">
          <div class="chart-label">新增店铺趋势</div>
          <ShopGrowthChart :data="platformData?.trends?.shops || []" />
        </div>
      </div>

      <div class="bottom-row">
        <div class="bottom-left">
          <ExpiringSeatsPanel
            :data="platformData?.expiring"
            :loading="loading"
          />
        </div>
        <div class="bottom-right">
          <div class="sub-box">
            <div class="chart-label">订阅类型分布</div>
            <SubscriptionPieChart :data="platformData?.distribution" />
            <SubscriptionDetail :data="platformData?.distribution" />
          </div>
        </div>
      </div>
    </template>

    <!-- 店铺首页 -->
    <template v-else>
      <div class="shop-cards">
        <StatCard
          v-for="card in shopCards"
          :key="card.key"
          :label="card.label"
          :value="shopStats[card.key] ?? '-'"
          :prefix="card.prefix"
          :color="card.color"
          :loading="loading"
        />
      </div>
      <div class="shop-placeholder">
        <span>经营趋势</span>
        <el-empty description="图表功能开发中" :image-size="60" />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  padding: 16px 20px;
  min-height: 100%;
  background: #f5f6fa;
}

.dashboard-header {
  margin-bottom: 12px;
}

.dash-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.chart-box {
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  padding: 10px 14px;
}

.chart-label {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  margin-bottom: 4px;
}

.bottom-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.bottom-left,
.bottom-right {
  min-width: 0;
}

.sub-box {
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  padding: 10px 14px;
  height: 100%;
}

.shop-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.shop-placeholder {
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  padding: 16px;
  text-align: center;

  span {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
  }
}
</style>
