// 在 Vite 等支持 TypeScript 转换和原生 ESM 的环境中使用。
console.log("首页模块已加载");

export async function openEditor(): Promise<void> {
  // 仅在调用 openEditor 时发起动态模块加载。
  const editor = await import("./editor");
  editor.startEditor();
}

// HTML 按钮或页面路由逻辑可以在需要时调用 openEditor。
