<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { http } from "@/utils/http";
import { useUserStoreHook } from "@/store/modules/user";
import type { PlatformDashboardData, ShopDashboardData } from "@/api/dashboard";
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
  {
    label: "今日营业额",
    key: "todaySales",
    prefix: "¥",
    icon: "💰",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "var(--color-stat-blue)"
  },
  {
    label: "今日订单",
    key: "todayOrders",
    icon: "📦",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "var(--color-stat-green)"
  },
  {
    label: "今日核销",
    key: "todayCheckins",
    icon: "✅",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    color: "var(--color-stat-orange)"
  },
  {
    label: "新顾客数",
    key: "todayNewCustomers",
    icon: "👥",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    color: "var(--color-stat-red)"
  }
]);

const load = async () => {
  loading.value = true;
  try {
    const r: any = await http.get("/dashboard/today");
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
  <div class="welcome-container">
    <div class="welcome-header">
      <h1 class="welcome-title">运营管理系统</h1>
      <p class="welcome-subtitle">
        {{ isPlatform ? "平台数据总览" : "店铺数据中心" }}
      </p>
    </div>

    <!-- 超管首页 -->
    <template v-if="isPlatform">
      <PlatformOverviewCards
        :overview="platformData?.overview"
        :top-tenants="platformData?.topTenants"
        :loading="loading"
      />

      <el-row :gutter="16" class="chart-section">
        <el-col :xs="24" :lg="16">
          <el-card v-loading="loading" shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="header-icon">📈</span>
                <span class="header-title">订阅收入趋势（近12月）</span>
              </div>
            </template>
            <RevenueTrendChart
              :data="platformData?.trends?.revenue || []"
              :loading="loading"
            />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="8">
          <el-card v-loading="loading" shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="header-icon">🎯</span>
                <span class="header-title">订阅类型分布</span>
              </div>
            </template>
            <SubscriptionPieChart
              :data="platformData?.distribution"
              :loading="loading"
              height="240px"
            />
            <SubscriptionDetail
              :data="platformData?.distribution"
              :loading="loading"
            />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="chart-section">
        <el-col :xs="24" :md="12">
          <el-card v-loading="loading" shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="header-icon">🏢</span>
                <span class="header-title">新增商户趋势（近12月）</span>
              </div>
            </template>
            <TenantGrowthChart
              :data="platformData?.trends?.tenants || []"
              :loading="loading"
            />
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card v-loading="loading" shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="header-icon">🏪</span>
                <span class="header-title">新增店铺趋势（近12月）</span>
              </div>
            </template>
            <ShopGrowthChart
              :data="platformData?.trends?.shops || []"
              :loading="loading"
            />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="chart-section">
        <el-col :xs="24" :md="16">
          <ExpiringSeatsPanel
            :data="platformData?.expiring"
            :loading="loading"
          />
        </el-col>
        <el-col :xs="24" :md="8">
          <el-card shadow="hover" class="info-card quick-actions">
            <template #header>
              <div class="card-header">
                <span class="header-icon">⚡</span>
                <span class="header-title">快捷操作</span>
              </div>
            </template>
            <div class="actions-grid">
              <router-link to="/admin/tenants" class="action-item">
                <div class="action-icon">🏢</div>
                <div class="action-label">租户管理</div>
              </router-link>
              <router-link to="/shop/list" class="action-item">
                <div class="action-icon">🏪</div>
                <div class="action-label">店铺管理</div>
              </router-link>
              <router-link to="/system/dict" class="action-item">
                <div class="action-icon">📊</div>
                <div class="action-label">数据字典</div>
              </router-link>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 店铺首页 -->
    <template v-else>
      <el-row :gutter="16" class="stats-row mb-6">
        <el-col v-for="card in shopCards" :key="card.key" :xs="12" :sm="6">
          <StatCard
            :label="card.label"
            :value="shopStats[card.key] ?? '-'"
            :prefix="card.prefix"
            :icon="card.icon"
            :gradient="card.gradient"
            :color="card.color"
            :loading="loading"
          />
        </el-col>
      </el-row>

      <el-row :gutter="16" class="info-row">
        <el-col :xs="24" :md="16">
          <el-card shadow="hover" class="info-card">
            <template #header>
              <div class="card-header">
                <span class="header-icon">📊</span>
                <span class="header-title">经营趋势</span>
              </div>
            </template>
            <div class="trend-placeholder">
              <el-empty description="趋势图表功能开发中..." :image-size="100" />
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="8">
          <el-card shadow="hover" class="info-card quick-actions">
            <template #header>
              <div class="card-header">
                <span class="header-icon">⚡</span>
                <span class="header-title">快捷操作</span>
              </div>
            </template>
            <div class="actions-grid">
              <router-link to="/inventory/list" class="action-item">
                <div class="action-icon">📦</div>
                <div class="action-label">库存管理</div>
              </router-link>
              <router-link to="/trade/orders" class="action-item">
                <div class="action-icon">🛒</div>
                <div class="action-label">订单管理</div>
              </router-link>
              <router-link to="/marketing/coupons" class="action-item">
                <div class="action-icon">🎫</div>
                <div class="action-label">优惠券</div>
              </router-link>
              <router-link to="/customer/list" class="action-item">
                <div class="action-icon">👥</div>
                <div class="action-label">客户管理</div>
              </router-link>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<style scoped lang="scss">
.welcome-container {
  padding: 24px;
  min-height: calc(100vh - 100px);
  background: linear-gradient(180deg, #f0f2f5 0%, #e8ecf1 100%);
}

.welcome-header {
  margin-bottom: 28px;
  text-align: center;

  .welcome-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 6px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .welcome-subtitle {
    font-size: 15px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

.chart-section {
  margin-bottom: 16px;
}

.chart-card {
  border-radius: 12px;
  border: none;
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-card__body) {
    padding: 16px;
  }
}

.card-header {
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

.stats-row {
  .el-col {
    margin-bottom: 12px;
  }
}

.info-row {
  .info-card {
    border-radius: 12px;
    height: 100%;
    border: none;
    transition: all 0.3s ease;
    margin-bottom: 16px;

    &:hover {
      box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.15);
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .card-header {
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
      flex: 1;
    }
  }
}

.quick-actions {
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 12px;
  }

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .action-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .action-label {
      font-size: 13px;
      color: var(--el-text-color-regular);
      font-weight: 500;
      text-align: center;
    }
  }
}

.trend-placeholder {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .welcome-container {
    padding: 16px;
  }

  .welcome-header {
    .welcome-title {
      font-size: 22px;
    }
    .welcome-subtitle {
      font-size: 13px;
    }
  }
}
</style>
