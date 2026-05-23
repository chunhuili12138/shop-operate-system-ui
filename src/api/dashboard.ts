import { http } from "@/utils/http";

export interface ExpiringSeat {
  id: number;
  tenant_name: string;
  tenant_id: number;
  end_date: string;
  remaining_days: number;
}

export interface TrendItem {
  period: string;
  total?: number;
  count?: number;
}

export interface PlatformOverview {
  totalTenants: number;
  activeTenants: number;
  bannedTenants: number;
  newTenantsThisMonth: number;
  totalShops: number;
  activeShops: number;
  newShopsThisMonth: number;
  activeSeats: number;
  expiredSeats: number;
  totalRevenue: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  totalRefund: number;
  refundThisMonth: number;
  seatUtilization: number;
  tenantsWithoutShops: number;
  totalCustomers: number;
}

export interface ExpiringData {
  within7Days: number;
  within30Days: number;
  within60Days: number;
  list: ExpiringSeat[];
}

export interface TrendData {
  revenue: TrendItem[];
  tenants: TrendItem[];
  shops: TrendItem[];
}

export interface SubscriptionDistribution {
  monthlyCount: number;
  yearlyCount: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

export interface TopTenant {
  name: string;
  revenue: number;
  tenant_id: number;
}

export interface PlatformDashboardData {
  overview: PlatformOverview;
  expiring: ExpiringData;
  trends: TrendData;
  distribution: SubscriptionDistribution;
  topTenants: TopTenant[];
}

export interface ShopDashboardData {
  todaySales?: number;
  todayRevenue?: number;
  todayOrders?: number;
  todayCheckins?: number;
  todayNewCustomers?: number;
  todayExpense?: number;
  monthRevenue?: number;
  monthExpense?: number;
  monthCheckins?: number;
  seatEndDate?: string;
  seatRemainingDays?: number;
  pendingRefunds?: number;
  pendingFeedbacks?: number;
  activeSessions?: number;
  todayQueue?: number;
  warnings?: Array<{ material_name: string; quantity: number; min_stock: number }>;
  totalCustomers?: number;
  activeCustomers?: number;
  walletBalance?: number;
  channels?: Array<{ channel: string; cnt: number; amount: number }>;
  topPackages?: Array<{ name: string; type: number; cnt: number }>;
  trendRevenues?: TrendItem[];
  trendExpenses?: TrendItem[];
  staffCheckins?: Array<{ name: string; cnt: number }>;
  todayAttendCount?: number;
  avgCustomerPrice?: number;
  refundRate?: number;
  returnRate?: number;
}

export interface DashboardTodayResult {
  success: boolean;
  code: number;
  msg: string;
  data: PlatformDashboardData | ShopDashboardData;
  timestamp: number;
}

export interface DailySnapshotQueryParams {
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
}

export interface DailySnapshotListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      snapshot_date: string;
      sales_total: number;
      revenue_confirmed: number;
      expense_total: number;
      new_customers: number;
      active_sessions: number;
      average_duration: number;
      inventory_warns?: string;
    }>;
    total: number;
  };
  timestamp: number;
}

export const getDashboardToday = () => {
  return http.request<DashboardTodayResult>("get", "/dashboard/today");
};

export const getShopDashboard = () => {
  return http.request<{ success: boolean; data: ShopDashboardData }>("get", "/dashboard/shop");
};

export const getDailySnapshots = (params?: DailySnapshotQueryParams) => {
  return http.request<DailySnapshotListResult>("get", "/dailySnapshots", {
    params
  });
};

export interface ShopRevenueTrendResult {
  success: boolean;
  data: {
    revenues: TrendItem[];
    expenses: TrendItem[];
  };
}

export const getShopRevenueTrend = (params: { startDate: string; endDate: string }) => {
  return http.request<ShopRevenueTrendResult>("get", "/dashboard/revenue", { params });
};
