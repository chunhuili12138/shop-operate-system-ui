import { http } from "@/utils/http";
import { ApiResult } from "@/types/api";

// ========== 文章管理相关 ==========

// 文章查询参数
export interface ArticleQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  isPublished?: number | string;
}

// 文章列表响应
export interface ArticleListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      title: string;
      is_published: number;
      created_at: string;
      category_id: string;
      content: string;
      cover_image: string;
      content_type: number;
    }>;
    total: number;
  };
  timestamp: number;
}

// 文章表单参数
export interface ArticleFormParams {
  articleId?: number | null;
  categoryId: string;
  title: string;
  content: string;
  coverImage: string;
  contentType: number;
}

// 文章分类列表响应
export interface ArticleCategoryListResult {
  success: boolean;
  code: number;
  msg: string;
  data: Array<{
    id: string;
    name: string;
  }>;
  timestamp: number;
}

// 发布/下架文章参数
export interface PublishArticleParams {
  articleId: number;
  isPublished: number;
}

/** 获取文章列表 */
export const getArticleList = (params?: ArticleQueryParams) => {
  return http.request<ArticleListResult>("get", "/articles", { params });
};

/** 获取文章分类列表 */
export const getArticleCategories = () => {
  return http.request<ArticleCategoryListResult>("get", "/articleCategories");
};

/** 新增文章 */
export const addArticle = (data: ArticleFormParams) => {
  return http.request<ApiResult>("post", "/articlesAdd", { data });
};

/** 更新文章 */
export const updateArticle = (data: ArticleFormParams) => {
  return http.request<ApiResult>("put", "/articlesUpdate", { data });
};

/** 发布/下架文章 */
export const publishArticle = (data: PublishArticleParams) => {
  return http.request<ApiResult>("put", "/articlesPublish", { data });
};

/** 删除文章 */
export const deleteArticle = (articleId: number) => {
  return http.request<ApiResult>("delete", "/articlesDelete", { 
    params: { articleId } 
  });
};

// ========== 优惠券管理相关 ==========

// 优惠券查询参数
export interface CouponQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
}

// 优惠券列表响应
export interface CouponListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      id: number;
      name: string;
      type: number;
      value: string;
      min_order_amount: string;
      total_stock: number;
      remain_stock: number;
      is_active: number;
      valid_days: number;
    }>;
    total: number;
  };
  timestamp: number;
}

// 优惠券表单参数
export interface CouponFormParams {
  couponId?: number | null;
  name: string;
  description?: string;
  type: number;
  useScene?: string;
  value: number | string;
  minOrderAmount: number | string;
  totalStock: number;
  perUserLimit?: number;
  validDays: number;
  autoGrantOnRegister?: number;
}

// 优惠券状态参数
export interface CouponStatusParams {
  couponId: number;
  isActive: number;
}

// 优惠券使用记录查询参数
export interface CouponUsageQueryParams {
  couponId?: number;
  page?: number;
  size?: number;
  customerKeyword?: string;
  status?: number;
  receivedStart?: string;
  receivedEnd?: string;
  usedStart?: string;
  usedEnd?: string;
}

// 优惠券使用记录列表响应
export interface CouponUsageListResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    list: Array<{
      customer_name: string;
      status: number;
      received_at: string;
      expires_at: string;
    }>;
    total: number;
  };
  timestamp: number;
}

// 发放优惠券参数
export interface GrantCouponParams {
  couponId: number;
  customerIds: string;
}

/** 获取优惠券列表 */
export const getCouponList = (params?: CouponQueryParams) => {
  return http.request<CouponListResult>("get", "/coupons", { params });
};

/** 新增优惠券 */
export const addCoupon = (data: CouponFormParams) => {
  return http.request<ApiResult>("post", "/couponsAdd", { data });
};

/** 更新优惠券 */
export const updateCoupon = (data: CouponFormParams) => {
  return http.request<ApiResult>("put", "/couponsUpdate", { data });
};

/** 切换优惠券状态 */
export const updateCouponStatus = (data: CouponStatusParams) => {
  return http.request<ApiResult>("put", "/couponsStatus", { data });
};

/** 获取优惠券使用记录 */
export const getCouponUsages = (params?: CouponUsageQueryParams) => {
  return http.request<CouponUsageListResult>("get", "/couponUsages", { params });
};

/** 发放优惠券 */
export const grantCoupon = (data: GrantCouponParams) => {
  return http.request<ApiResult>("post", "/couponUsagesGrant", { data });
};

// 按条件批量发放参数
export interface BatchGrantParams {
  couponId: number;
  tags?: string;
  source?: string;
  customerIds?: string;
}

// 批量发放响应
export interface BatchGrantResult {
  success: boolean;
  code: number;
  msg: string;
  data: {
    total: number;
    granted: number;
    skipped: number;
  };
  timestamp: number;
}

/** 按条件批量发放优惠券 */
export const grantCouponBatch = (data: BatchGrantParams) => {
  return http.request<BatchGrantResult>("post", "/couponUsagesGrantBatch", { data });
};

// 预览匹配顾客
export interface PreviewCustomer {
  id: number;
  nickname: string;
  phone: string;
  tags: string;
  alreadyCount: number;
  canGrant: boolean;
}

export interface GrantPreviewParams {
  couponId: number;
  tags?: string;
  source?: string;
}

/** 预览符合条件可发放的顾客 */
export const getGrantPreview = (params: GrantPreviewParams) => {
  return http.request<ApiResult<PreviewCustomer[]>>("get", "/couponsGrantPreview", { params });
};

/** 删除优惠券 */
export const deleteCoupon = (couponId: number) => {
  return http.request<ApiResult>("delete", "/couponsDelete", { params: { couponId } });
};

// 可用优惠券（购买时选择）
export interface AvailableCoupon {
  coupon_usage_id: number;
  coupon_id: number;
  name: string;
  type: number;
  value: string;
  min_order_amount: string;
  valid_days: number;
  expires_at: string;
  received_at: string;
}

export interface AvailableCouponQueryParams {
  customerId: number;
  packageId?: number;
  scene?: string;
}

/** 查询顾客当前可用的优惠券 */
export const getAvailableCoupons = (params: AvailableCouponQueryParams) => {
  return http.request<ApiResult<AvailableCoupon[]>>("get", "/couponsAvailable", { params });
};
