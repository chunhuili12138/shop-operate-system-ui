import { http } from "@/utils/http";
import type { ApiResult } from "@/types/api";

// 反馈查询参数
export interface FeedbackQueryParams {
  page?: number;
  size?: number;
}

// 反馈信息
export interface FeedbackInfo {
  id: number;
  customer_name?: string;
  feedback_type: number;
  rating?: number;
  content: string;
  status: number;
  reply_content?: string;
  created_at?: string;
}

// 反馈列表响应
export interface FeedbackListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: FeedbackInfo[];
    total: number;
  };
  timestamp: number;
}

// 回复反馈参数
export interface FeedbackReplyParams {
  feedbackId: number;
  replyContent: string;
}

/** 获取反馈列表 */
export const getFeedbackList = (params?: FeedbackQueryParams) => {
  return http.request<FeedbackListResult>("get", "/feedbacks/page", { params });
};

/** 获取反馈详情 */
export const getFeedbackInfo = (feedbackId: number) => {
  return http.request<ApiResult>("get", "/feedbacks/info", {
    params: { feedbackId }
  });
};

/** 回复反馈 */
export const replyFeedback = (data: FeedbackReplyParams) => {
  return http.request<ApiResult>("put", "/feedbacks/reply", { data });
};
