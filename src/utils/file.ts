/**
 * 生成文件访问完整 URL（直接请求 Java 后端，绕过 IIS）
 */
export function fileUrl(relativePath: string): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  const serverUrl = apiBaseUrl.replace(/\/api\/?$/, "");
  return `${serverUrl}/api/file/image?name=${encodeURIComponent(relativePath)}`;
}
