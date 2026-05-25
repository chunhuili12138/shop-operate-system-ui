import { http } from "@/utils/http";
import type { ApiResult, PageResult } from "@/types/api";

// ============= 购买记录 =============

export interface PurchaseQueryParams {
  page?: number;
  size?: number;
  customersId?: number;
  keyword?: string;
  channel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface PurchaseRecord {
  id: number;
  shop_id: number;
  customer_id: number;
  package_id: number;
  channel: string;
  third_party_coupon_code?: string;
  coupon_usage_id?: number;
  coupon_discount?: number;
  start_date?: string;
  total_amount: number;
  paid_amount: number;
  payment_method?: string;
  status: number;
  operator_staff_id?: number;
  remark?: string;
  created_at?: string;
  package_name?: string;
  customer_name?: string;
}

export interface AddPurchaseParams {
  customersId: number;
  packageId: number;
  channel?: string;
  paymentType: "direct" | "wallet" | "coupon";
  paymentMethod?: string;
  totalAmount: number;
  paidAmount?: number;
  thirdPartyCouponCode?: string;
  couponUsageId?: number;
  remark?: string;
}

export const getPurchaseList = (params?: PurchaseQueryParams) => {
  return http.request<ApiResult<PageResult<PurchaseRecord>>>(
    "get",
    "/purchases",
    { params }
  );
};

export const addPurchase = (data: AddPurchaseParams) => {
  return http.request<ApiResult>("post", "/purchasesAdd", { data });
};

// ============= 核销管理 =============

export interface AvailableSession {
  id: number;
  customer_id: number;
  purchase_id: number;
  session_date: string;
  status: number;
  package_name?: string;
}

export interface GameSession {
  id: number;
  shop_id: number;
  customer_id: number;
  customer_session_id: number;
  staff_id: number;
  start_time: string;
  end_time?: string;
  status: number;
  customer_name?: string;
  staff_name?: string;
  package_name?: string;
  duration_minutes?: number;
}

export const getGameSessions = (params?: {
  customersId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  size?: number;
}) => {
  return http.request<ApiResult<PageResult<GameSession>>>(
    "get",
    "/gameSessions/list",
    { params }
  );
};

export const getAvailableSessions = (customersId: number) => {
  return http.request<ApiResult<AvailableSession[]>>(
    "get",
    "/gameSessions/available",
    {
      params: { customersId }
    }
  );
};

export const getGameSessionInfo = (gameSessionId: number) => {
  return http.request<ApiResult<GameSession>>("get", "/gameSessions/info", {
    params: { gameSessionId }
  });
};

export const checkin = (data: {
  customersId: number;
  customerSessionId: number;
}) => {
  return http.request<ApiResult>("post", "/gameSessionsCheckin", { data });
};

export const finishGameSession = (gameSessionId: number) => {
  return http.request<ApiResult>("put", "/gameSessionsFinish", {
    data: { gameSessionId }
  });
};

// ============= 退款管理 =============

export interface RefundRecord {
  id: number;
  shop_id: number;
  purchase_id: number;
  refund_amount: number;
  reason?: string;
  deducted_amount?: number;
  refund_prepay_amount?: number;
  refund_wallet_amount?: number;
  refunded_sessions?: number;
  status: number;
  operated_by?: number;
  created_at?: string;
  updated_at?: string;
  purchase_amount?: number;
  payment_method?: string;
  customer_name?: string;
}

export interface RefundPreview {
  purchase_id: number;
  total_sessions: number;
  used_sessions: number;
  expired_sessions: number;
  remaining_sessions: number;
  suggested_amount: number;
  paid_amount: number;
  total_amount: number;
  package_name?: string;
}

export const getRefundList = (params?: {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return http.request<ApiResult<PageResult<RefundRecord>>>(
    "get",
    "/purchasesRefunds",
    { params }
  );
};

export const getRefundPreview = (purchaseId: number) => {
  return http.request<ApiResult<RefundPreview>>(
    "get",
    "/purchasesRefundsPreview",
    {
      params: { purchaseId }
    }
  );
};

export const applyRefund = (
  purchaseId: number,
  reason: string,
  refundAmount: number
) => {
  return http.request<ApiResult>("post", "/purchasesRefundsApply", {
    data: { purchaseId, reason, refundAmount: refundAmount.toFixed(2) }
  });
};

export const approveRefund = (refundId: number) => {
  return http.request<ApiResult>("put", "/purchasesRefundsApprove", {
    data: { refundId }
  });
};

export const rejectRefund = (refundId: number, reason: string) => {
  return http.request<ApiResult>("put", "/purchasesRefundsReject", {
    data: { refundId, reason }
  });
};

// ============= 购买Sessions明细 =============

export interface CustomerSessionDetail {
  id: number;
  purchase_id: number;
  session_date: string;
  status: number;
  used_at?: string;
  game_session_id?: number;
}

export const getPurchaseSessions = (purchaseId: number) => {
  return http.request<ApiResult<CustomerSessionDetail[]>>(
    "get",
    "/gameSessions/sessions",
    {
      params: { purchaseId }
    }
  );
};
