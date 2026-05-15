import { http } from "@/utils/http";
import type { ApiResult } from "@/types/api";

// ========== 提成规则相关 ==========

// 提成规则查询参数
export interface CommissionRuleQueryParams {
  page?: number;
  size?: number;
}

// 提成规则列表响应
export interface CommissionRuleListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: any[];
    total: number;
  };
  timestamp: number;
}

// 提成规则表单参数
export interface CommissionRuleFormParams {
  roleId: string;
  ruleType: number;
  value: string;
  description: string;
}

/** 获取提成规则列表 */
export const getCommissionRules = (params?: CommissionRuleQueryParams) => {
  return http.request<CommissionRuleListResult>("get", "/commissionRules", {
    params
  });
};

/** 新增提成规则 */
export const addCommissionRule = (data: CommissionRuleFormParams) => {
  return http.request<ApiResult>("post", "/commissionRulesAdd", { data });
};

// ========== 结算记录相关 ==========

// 结算记录查询参数
export interface CommissionSettlementQueryParams {
  page?: number;
  size?: number;
}

// 结算记录列表响应
export interface CommissionSettlementListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: any[];
    total: number;
  };
  timestamp: number;
}

// 生成结算参数
export interface GenerateSettlementParams {
  settlementPeriod: string;
}

// 支付结算参数
export interface PaySettlementParams {
  settlementId: number;
}

/** 获取结算记录列表 */
export const getCommissionSettlements = (
  params?: CommissionSettlementQueryParams
) => {
  return http.request<CommissionSettlementListResult>(
    "get",
    "/commissionSettlements",
    { params }
  );
};

/** 生成结算 */
export const generateSettlement = (data: GenerateSettlementParams) => {
  return http.request<ApiResult>("post", "/commissionSettlementsGenerate", {
    data
  });
};

/** 支付结算 */
export const paySettlement = (data: PaySettlementParams) => {
  return http.request<ApiResult>("put", "/commissionSettlementsPay", { data });
};

// ========== 支出管理相关 ==========

// 支出查询参数
export interface ExpenseQueryParams {
  page?: number;
  size?: number;
}

// 支出列表响应
export interface ExpenseListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: any[];
    total: number;
  };
  timestamp: number;
}

// 支出表单参数
export interface ExpenseFormParams {
  expenseId?: number | null;
  categoryId: string;
  amount: string;
  paymentMethod: string;
  expenseDate: string;
  remark: string;
}

/** 获取支出列表 */
export const getExpenseList = (params?: ExpenseQueryParams) => {
  return http.request<ExpenseListResult>("get", "/expenses", { params });
};

/** 获取支出分类列表 */
export const getExpenseCategories = () => {
  return http.request<ApiResult>("get", "/expenseCategories");
};

/** 新增支出 */
export const addExpense = (data: ExpenseFormParams) => {
  return http.request<ApiResult>("post", "/expensesAdd", { data });
};

/** 更新支出 */
export const updateExpense = (data: ExpenseFormParams) => {
  return http.request<ApiResult>("put", "/expensesUpdate", { data });
};

/** 删除支出 */
export const deleteExpense = (expenseId: number) => {
  return http.request<ApiResult>("delete", "/expensesDelete", {
    params: { expenseId }
  });
};

// ========== 发票管理相关 ==========

// 发票查询参数
export interface InvoiceQueryParams {
  page?: number;
  size?: number;
}

// 发票列表响应
export interface InvoiceListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: any[];
    total: number;
  };
  timestamp: number;
}

// 发票表单参数
export interface InvoiceFormParams {
  referenceType: string;
  referenceId: string;
  invoiceNumber: string;
  amount: string;
  issuedAt: string;
}

/** 获取发票列表 */
export const getInvoiceList = (params?: InvoiceQueryParams) => {
  return http.request<InvoiceListResult>("get", "/invoices", { params });
};

/** 新增发票 */
export const addInvoice = (data: InvoiceFormParams) => {
  return http.request<ApiResult>("post", "/invoicesAdd", { data });
};

// ========== 通知管理相关 ==========

// 通知查询参数
export interface NotificationQueryParams {
  page?: number;
  size?: number;
}

// 通知列表响应
export interface NotificationListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: string;
      title: string;
      content: string;
      status: number;
      created_at: string;
    }>;
    total: number;
  };
  timestamp: number;
}

// 标记已读参数
export interface MarkNotificationsReadParams {
  notificationIds: string;
}

/** 获取通知列表 */
export const getNotificationList = (params?: NotificationQueryParams) => {
  return http.request<NotificationListResult>("get", "/notifications", {
    params
  });
};

/** 标记通知为已读 */
export const markNotificationsRead = (data: MarkNotificationsReadParams) => {
  return http.request<ApiResult>("put", "/notificationsRead", { data });
};

// ========== 收入管理相关 ==========

// 收入查询参数
export interface RevenueQueryParams {
  page?: number;
  size?: number;
}

// 收入列表响应
export interface RevenueListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      game_session_id: number;
      amount: number;
      staff_name: string;
      confirmed_at: string;
    }>;
    total: number;
  };
  timestamp: number;
}

/** 获取收入列表 */
export const getRevenueList = (params?: RevenueQueryParams) => {
  return http.request<RevenueListResult>("get", "/revenues", { params });
};
