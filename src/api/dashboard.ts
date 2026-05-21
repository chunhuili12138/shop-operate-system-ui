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
  todayOrders?: number;
  todayCheckins?: number;
  todayNewCustomers?: number;
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
      snapshot_date: string;
      sales_total: number;
      revenue_confirmed: number;
      new_customers: number;
      active_sessions: number;
      average_duration: number;
    }>;
    total: number;
  };
  timestamp: number;
}

export const getDashboardToday = () => {
  return http.request<DashboardTodayResult>("get", "/dashboard/today");
};

export const getDailySnapshots = (params?: DailySnapshotQueryParams) => {
  return http.request<DailySnapshotListResult>("get", "/dailySnapshots", {
    params
  });
};
