// 教学示例：服务端提供 /version.json 并设置 Cache-Control: no-store。
// 检测到新版后只发出提示，不强制刷新，避免丢失未保存的用户数据。
type VersionInfo = { buildId: string };
export async function checkForNewVersion(currentBuildId: string): Promise<boolean> {
  const response = await fetch("/version.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Version check failed: ${response.status}`);
  const data = (await response.json()) as VersionInfo;
  return data.buildId !== currentBuildId;
}

// 应用层可在切换页面/窗口重新获得焦点时调用，并向用户提供“刷新更新”操作。
