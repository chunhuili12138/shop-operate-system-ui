/**
 * 通用 API 响应类型定义
 * 后端规范：success=true → 业务成功，success=false → 业务/系统失败
 * code=200 表示业务已处理（成功或失败看 success），code≠200 为系统级错误
 */
export type ApiResult<T = any> = {
  /** 业务是否成功 */
  success: boolean;
  /** 状态码：200=业务已处理，401/404/500=系统级错误 */
  code: number;
  /** 业务提示信息 */
  msg: string;
  /** 响应数据 */
  data: T;
  /** 时间戳 */
  timestamp: number;
};

/**
 * 分页响应数据类型
 */
export type PageResult<T = any> = {
  /** 数据列表 */
  list: T[];
  /** 总条数 */
  total: number;
  /** 当前页码 */
  pageNum: number;
  /** 每页条数 */
  pageSize: number;
};

/**
 * 登录响应数据类型
 */
export type LoginResult = {
  /** 访问令牌 */
  token: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 过期时间 */
  expires: Date | string;
  /** 是否超级管理员 */
  superAdmin?: boolean;
};

/**
 * 用户信息类型
 */
export type UserInfo = {
  /** 用户ID */
  userId: number;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 头像 */
  avatar: string;
  /** 角色列表 */
  roles: string[];
  /** 权限列表 */
  buttons: string[];
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
};

/**
 * 刷新 Token 响应类型
 */
export type RefreshTokenResult = {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 过期时间 */
  expires: Date | string;
};
