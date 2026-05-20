/**
 * 日期时间工具函数
 */

/**
 * 格式化日期，只显示年月日
 * @param dateStr 日期字符串或Date对象
 * @returns 格式化后的日期字符串 YYYY-MM-DD
 */
export const formatDate = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return "-";
  
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "-";
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
};

/**
 * 格式化日期时间，显示年月日时分秒
 * @param dateStr 日期字符串或Date对象
 * @returns 格式化后的日期时间字符串 YYYY-MM-DD HH:mm:ss
 */
export const formatDateTime = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return "-";
  
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "-";
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化时间，只显示时分
 * @param dateStr 日期字符串或Date对象
 * @returns 格式化后的时间字符串 HH:mm
 */
export const formatTime = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return "-";
  
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "-";
  }
  
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  
  return `${hours}:${minutes}`;
};
