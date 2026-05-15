import { http } from "@/utils/http";

// Dashboard今日数据响应
export interface DashboardTodayResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    totalTenants?: number;
    totalShops?: number;
    activeSeats?: number;
    newTenantsThisMonth?: number;
    todaySales?: number;
    todayOrders?: number;
    todayCheckins?: number;
    todayNewCustomers?: number;
    expiringSoon?: Array<{
      id: number;
      tenant_name: string;
      end_date: string;
    }>;
  };
  timestamp: number;
}

// 日快照查询参数
export interface DailySnapshotQueryParams {
  page?: number;
  size?: number;
}

// 日快照列表响应
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

/** 获取Dashboard今日数据 */
export const getDashboardToday = () => {
  return http.request<DashboardTodayResult>("get", "/dashboard/today");
};

/** 获取日快照列表 */
export const getDailySnapshots = (params?: DailySnapshotQueryParams) => {
  return http.request<DailySnapshotListResult>("get", "/dailySnapshots", {
    params
  });
};
