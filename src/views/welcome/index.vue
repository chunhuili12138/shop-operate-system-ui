<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStoreHook } from "@/store/modules/user";
import { getDashboardToday, getShopDashboard, type PlatformDashboardData, type ShopDashboardData } from "@/api/dashboard";
import StatCard from "./components/StatCard.vue";
import PlatformOverviewCards from "./components/PlatformOverviewCards.vue";
import RevenueTrendChart from "./components/RevenueTrendChart.vue";
import TenantGrowthChart from "./components/TenantGrowthChart.vue";
import ShopGrowthChart from "./components/ShopGrowthChart.vue";
import ExpiringSeatsPanel from "./components/ExpiringSeatsPanel.vue";
import SubscriptionPieChart from "./components/SubscriptionPieChart.vue";
import SubscriptionDetail from "./components/SubscriptionDetail.vue";
import ShopRevenueTrend from "./components/ShopRevenueTrend.vue";

defineOptions({ name: "Welcome" });

const router = useRouter();
const loading = ref(true);
const isSuper = useUserStoreHook().superAdmin;
const isPlatform = ref(isSuper.value);
const activeTab = ref("overview");

const platformData = ref<PlatformDashboardData | null>(null);
const d = ref<ShopDashboardData>({});

const fmtMoney = (v: any) => { const n = Number(v); return isNaN(n) ? "-" : `¥${n.toFixed(2)}`; };
const fmtPct = (v: any) => { const n = Number(v); return isNaN(n) ? "-" : `${(n * 100).toFixed(1)}%`; };
const fmtNum = (v: any) => { const n = Number(v); return isNaN(n) ? "-" : String(n); };

const seatLabel = computed(() => {
  const r = d.value.seatRemainingDays;
  if (r == null) return "";
  if (r < 0) return `已到期 ${Math.abs(r)} 天`;
  if (r <= 7) return `即将到期，剩余 ${r} 天`;
  return `有效期至 ${d.value.seatEndDate?.substring(0, 10) || ""}`;
});
const seatTag = computed(() => {
  const r = d.value.seatRemainingDays;
  if (r == null) return "info"; if (r < 0) return "danger"; if (r <= 7) return "warning"; return "success";
});
const chanLabel = (v: string) => ({ store: "门店", meituan: "美团", douyin: "抖音", miniapp: "小程序" } as any)[v] || v;
const pkgTypeLabel = (v: number) => ({ 1: "单次", 2: "周卡", 3: "月卡" } as any)[v] || v;

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
        const s = await getShopDashboard();
        if (s?.success) d.value = s.data || {};
      }
    }
  } finally { loading.value = false; }
};

const go = (path: string) => router.push(path);

onMounted(load);
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2 class="dash-title">{{ isPlatform ? "平台数据总览" : "店铺数据中心" }}</h2>
      <el-tag v-if="!isPlatform && seatLabel" :type="seatTag" size="small" effect="plain">{{ seatLabel }}</el-tag>
    </div>

    <!-- 超管 -->
    <template v-if="isPlatform">
      <PlatformOverviewCards :overview="platformData?.overview" :top-tenants="platformData?.topTenants" :loading="loading" />
      <div class="charts-row">
        <div class="chart-box"><div class="chart-label">订阅收入趋势</div><RevenueTrendChart :data="platformData?.trends?.revenue || []" /></div>
        <div class="chart-box"><div class="chart-label">新增商户趋势</div><TenantGrowthChart :data="platformData?.trends?.tenants || []" /></div>
        <div class="chart-box"><div class="chart-label">新增店铺趋势</div><ShopGrowthChart :data="platformData?.trends?.shops || []" /></div>
      </div>
      <div class="bottom-row">
        <div class="bottom-left"><ExpiringSeatsPanel :data="platformData?.expiring" :loading="loading" /></div>
        <div class="bottom-right"><div class="sub-box"><div class="chart-label">订阅类型分布</div><SubscriptionPieChart :data="platformData?.distribution" /><SubscriptionDetail :data="platformData?.distribution" /></div></div>
      </div>
    </template>

    <!-- 店铺 tab 看板 -->
    <template v-else>
      <el-tabs v-model="activeTab" class="dash-tabs">
        <!-- ============ 总览 ============ -->
        <el-tab-pane label="总览" name="overview">
          <!-- 6 卡片 -->
          <div class="cards-row">
            <StatCard label="今日收现" :value="d.todaySales" prefix="¥" color="#667eea" :loading="loading" />
            <StatCard label="确认收入" :value="d.todayRevenue" prefix="¥" color="#43e97b" :loading="loading" />
            <StatCard label="今日支出" :value="d.todayExpense" prefix="¥" color="#f56c6c" :loading="loading" />
            <StatCard label="今日订单" :value="d.todayOrders" color="#f5576c" :loading="loading" />
            <StatCard label="今日核销" :value="d.todayCheckins" color="#4facfe" :loading="loading" />
            <StatCard label="新顾客" :value="d.todayNewCustomers" color="#ff9800" :loading="loading" />
          </div>
          <!-- 本月统计 -->
          <div class="mini-row">
            <div class="mini-item"><span class="mini-label">本月收入</span><span class="mini-val green">{{ fmtMoney(d.monthRevenue) }}</span></div>
            <div class="mini-item"><span class="mini-label">本月支出</span><span class="mini-val red">{{ fmtMoney(d.monthExpense) }}</span></div>
            <div class="mini-item"><span class="mini-label">本月核销</span><span class="mini-val">{{ d.monthCheckins ?? "-" }} 次</span></div>
          </div>
          <!-- 待处理 + 预警 双栏 -->
          <div class="overview-bottom">
            <div class="overview-left">
              <!-- 待处理 -->
              <div class="section-title">待处理事项</div>
              <div class="pending-grid">
                <div class="pending-card" :class="{ alert: d.pendingRefunds }" @click="go('/trade/refund')">
                  <div class="pending-num" :style="{ color: d.pendingRefunds ? 'var(--el-color-danger)' : '#999' }">{{ d.pendingRefunds ?? 0 }}</div>
                  <div class="pending-label">待处理退款</div>
                </div>
                <div class="pending-card" :class="{ alert: d.pendingFeedbacks }" @click="go('/feedbacks')">
                  <div class="pending-num" :style="{ color: d.pendingFeedbacks ? 'var(--el-color-warning)' : '#999' }">{{ d.pendingFeedbacks ?? 0 }}</div>
                  <div class="pending-label">待回复评价</div>
                </div>
                <div class="pending-card" @click="go('/trade/checkin')">
                  <div class="pending-num" style="color:#4facfe">{{ d.activeSessions ?? 0 }}</div>
                  <div class="pending-label">进行中游玩</div>
                </div>
                <div class="pending-card">
                  <div class="pending-num" style="color:#999">{{ d.todayQueue ?? 0 }}</div>
                  <div class="pending-label">今日排队</div>
                </div>
              </div>
            </div>
            <div class="overview-right">
              <!-- 库存预警 -->
              <div class="section-title">
                库存预警
                <el-button v-if="(d.warnings?.length||0) > 0" link type="primary" size="small" @click="go('/inventory/list')">查看全部</el-button>
              </div>
              <div class="warn-list" v-if="d.warnings?.length">
                <div v-for="(w,i) in d.warnings" :key="i" class="warn-item">
                  <span class="warn-name">{{ w.material_name }}</span>
                  <span class="warn-stock">{{ w.quantity }} / 预警 {{ w.min_stock }}</span>
                </div>
              </div>
              <div v-else class="empty-text">暂无预警</div>
            </div>
          </div>
        </el-tab-pane>

        <!-- ============ 营收 ============ -->
        <el-tab-pane label="营收分析" name="revenue">
          <div class="trend-box"><div class="chart-label">近 7 日收入支出</div><ShopRevenueTrend :revenues="d.trendRevenues || []" :expenses="d.trendExpenses || []" /></div>
          <div class="mini-row">
            <div class="mini-item"><span class="mini-label">30天客单价</span><span class="mini-val green">{{ fmtMoney(d.avgCustomerPrice) }}</span></div>
            <div class="mini-item"><span class="mini-label">30天退款率</span><span class="mini-val" :class="{ red: (d.refundRate||0) > 0.05 }">{{ fmtPct(d.refundRate) }}</span></div>
            <div class="mini-item"><span class="mini-label">本月收入</span><span class="mini-val green">{{ fmtMoney(d.monthRevenue) }}</span></div>
            <div class="mini-item"><span class="mini-label">本月支出</span><span class="mini-val red">{{ fmtMoney(d.monthExpense) }}</span></div>
          </div>
          <div class="section-title">30天渠道来源</div>
          <div class="channel-bars" v-if="d.channels?.length">
            <div v-for="ch in d.channels" :key="ch.channel" class="chan-row">
              <span class="chan-name">{{ chanLabel(ch.channel) }}</span>
              <div class="chan-bar-bg"><div class="chan-bar-fill" :style="{ width: Math.min(100, (ch.cnt / (d.channels?.[0]?.cnt || 1)) * 100) + '%' }" /></div>
              <span class="chan-info">{{ ch.cnt }} 单 / {{ fmtMoney(ch.amount) }}</span>
            </div>
          </div>
        </el-tab-pane>

        <!-- ============ 顾客 ============ -->
        <el-tab-pane label="顾客分析" name="customer">
          <div class="cards-row cards-4">
            <StatCard label="总顾客" :value="d.totalCustomers" color="#667eea" :loading="loading" />
            <StatCard label="月活跃顾客" :value="d.activeCustomers" color="#43e97b" :loading="loading" />
            <StatCard label="回头率" :value="fmtPct(d.returnRate)" color="#f5576c" :loading="loading" />
            <StatCard label="储值余额" :value="fmtMoney(d.walletBalance)" color="#ff9800" :loading="loading" />
          </div>
          <div class="section-title">30天渠道来源</div>
          <div class="channel-bars" v-if="d.channels?.length">
            <div v-for="ch in d.channels" :key="ch.channel" class="chan-row">
              <span class="chan-name">{{ chanLabel(ch.channel) }}</span>
              <div class="chan-bar-bg"><div class="chan-bar-fill" :style="{ width: Math.min(100, (ch.cnt / (d.channels?.[0]?.cnt || 1)) * 100) + '%' }" /></div>
              <span class="chan-info">{{ ch.cnt }} 单 / {{ fmtMoney(ch.amount) }}</span>
            </div>
          </div>
        </el-tab-pane>

        <!-- ============ 运营 ============ -->
        <el-tab-pane label="运营分析" name="ops">
          <div class="section-title">30天热销套餐 TOP5</div>
          <div class="channel-bars" v-if="d.topPackages?.length">
            <div v-for="(p, i) in d.topPackages" :key="i" class="chan-row">
              <span class="chan-name">{{ p.name }} <el-tag size="small" type="info">{{ pkgTypeLabel(p.type) }}</el-tag></span>
              <div class="chan-bar-bg"><div class="chan-bar-fill ops-bar" :style="{ width: Math.min(100, (p.cnt / (d.topPackages?.[0]?.cnt || 1)) * 100) + '%' }" /></div>
              <span class="chan-info">{{ p.cnt }} 单</span>
            </div>
          </div>
          <div class="mini-row" style="margin-top:16px">
            <div class="mini-item"><span class="mini-label">进行中游玩</span><span class="mini-val" style="color:#4facfe">{{ d.activeSessions ?? 0 }}</span></div>
            <div class="mini-item"><span class="mini-label">今日排队</span><span class="mini-val">{{ d.todayQueue ?? 0 }}</span></div>
            <div class="mini-item"><span class="mini-label">本月核销</span><span class="mini-val">{{ d.monthCheckins ?? 0 }} 次</span></div>
          </div>
        </el-tab-pane>

        <!-- ============ 员工 ============ -->
        <el-tab-pane label="员工绩效" name="staff">
          <div class="mini-row">
            <div class="mini-item"><span class="mini-label">今日打卡</span><span class="mini-val">{{ d.todayAttendCount ?? 0 }} 人</span></div>
            <div class="mini-item"><span class="mini-label">今日核销</span><span class="mini-val">{{ d.todayCheckins ?? 0 }} 次</span></div>
          </div>
          <div class="section-title">今日核销排行</div>
          <div class="channel-bars" v-if="d.staffCheckins?.length">
            <div v-for="(s, i) in d.staffCheckins" :key="i" class="chan-row">
              <span class="chan-name">{{ s.name }}</span>
              <div class="chan-bar-bg"><div class="chan-bar-fill staff-bar" :style="{ width: Math.min(100, (s.cnt / (d.staffCheckins?.[0]?.cnt || 1)) * 100) + '%' }" /></div>
              <span class="chan-info">{{ s.cnt }} 次</span>
            </div>
          </div>
          <div v-else class="empty-text">今日暂无核销记录</div>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<style scoped lang="scss">
.dashboard { padding: 16px 20px; min-height: 100%; background: #f5f6fa; }
.dashboard-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.dash-title { font-size: 16px; font-weight: 600; color: #333; margin: 0; }

/* 超管 */
.charts-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
.chart-box, .trend-box { background: #fff; border-radius: 8px; border: 1px solid #ebeef5; padding: 10px 14px; }
.chart-label { font-size: 13px; font-weight: 600; color: #666; margin-bottom: 6px; }
.bottom-row { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; }
.sub-box { background: #fff; border-radius: 8px; border: 1px solid #ebeef5; padding: 10px 14px; height: 100%; }
.empty-text { color: #bbb; font-size: 13px; text-align: center; padding: 20px 0; }

/* Tabs */
.dash-tabs { margin-top: -8px; }
.dash-tabs :deep(.el-tabs__header) { margin-bottom: 12px; }

/* 卡片行 */
.cards-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 14px; }
.cards-row.cards-4 { grid-template-columns: repeat(4, 1fr); }

/* 迷你统计条 */
.mini-row { display: flex; gap: 0; background: #fff; border-radius: 8px; border: 1px solid #ebeef5; margin-bottom: 14px; overflow: hidden; }
.mini-item { flex: 1; text-align: center; padding: 12px 8px; border-right: 1px solid #ebeef5; }
.mini-item:last-child { border-right: none; }
.mini-label { display: block; font-size: 12px; color: #999; margin-bottom: 4px; }
.mini-val { font-size: 16px; font-weight: 700; color: #333; }
.mini-val.green { color: #43e97b; }
.mini-val.red { color: #f56c6c; }

/* 区块标题 */
.section-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }

/* 总览下半区 */
.overview-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.overview-left, .overview-right { background: #fff; border-radius: 8px; border: 1px solid #ebeef5; padding: 14px 16px; }

/* 待处理 */
.pending-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.pending-card { text-align: center; padding: 12px 8px; border-radius: 8px; background: var(--el-fill-color-light); cursor: pointer; }
.pending-card.alert { background: #fef0f0; }
.pending-num { font-size: 24px; font-weight: 700; }
.pending-label { font-size: 12px; color: #999; margin-top: 4px; }

/* 库存预警 */
.warn-list { max-height: 200px; overflow-y: auto; }
.warn-item { display: flex; justify-content: space-between; padding: 7px 0; font-size: 12px; border-bottom: 1px dashed #ebeef5; }
.warn-item:last-child { border-bottom: none; }
.warn-name { color: var(--el-color-danger); }
.warn-stock { color: #999; font-size: 11px; }

/* 渠道/套餐/员工 进度条 */
.channel-bars { background: #fff; border-radius: 8px; border: 1px solid #ebeef5; padding: 12px 16px; }
.chan-row { display: flex; align-items: center; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
.chan-row:last-child { border-bottom: none; }
.chan-name { width: 140px; flex-shrink: 0; color: #333; }
.chan-bar-bg { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin: 0 12px; }
.chan-bar-fill { height: 100%; background: #667eea; border-radius: 4px; transition: width 0.5s; }
.chan-bar-fill.ops-bar { background: #43e97b; }
.chan-bar-fill.staff-bar { background: #4facfe; }
.chan-info { width: 120px; text-align: right; color: #999; font-size: 12px; white-space: nowrap; }

.trend-box { margin-bottom: 14px; }

@media (max-width: 1100px) {
  .cards-row { grid-template-columns: repeat(3, 1fr); }
  .cards-row.cards-4 { grid-template-columns: repeat(2, 1fr); }
  .pending-grid { grid-template-columns: repeat(2, 1fr); }
  .overview-bottom { grid-template-columns: 1fr; }
  .mini-row { flex-wrap: wrap; }
  .mini-item { flex-basis: 50%; }
}
@media (max-width: 768px) {
  .cards-row { grid-template-columns: repeat(2, 1fr); }
  .chan-name { width: 80px; }
}
</style>
