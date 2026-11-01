# 第 9 天 · 第 6 题：Vite 代码分割与 React.lazy

**评分：75/100**

## 1. 减少首屏 JavaScript（45/50）

- 使用构建产物分析工具定位大依赖、重复依赖、非首屏业务模块。
- 对路由及非首屏组件使用动态 import，实现按需加载。
- Tree Shaking、按需引入库、避免引入大型全量依赖。
- 合理拆分公共依赖以改善长期缓存复用，但公共 chunk 如果首屏仍必需，不会直接减少首屏总下载/执行量。

## 2. React.lazy 与 Vite Code Splitting（30/50）

```tsx
import { lazy, Suspense } from "react";
const Settings = lazy(() => import("./Settings"));
function App() {
  return <Suspense fallback={<div>Loading...</div>}><Settings /></Suspense>;
}
```

- React.lazy 是 React 组件层面的懒加载机制，在首次尝试渲染时调用加载函数，配合 Suspense 展示加载态。
- 动态 import() 是 JavaScript 模块加载语法，也是构建工具识别异步代码边界的依据。
- Vite 生产构建通过 Rollup 生成独立 chunk；代码分割不依赖 React.lazy，也不等同于公共依赖提取。
- 公共依赖提取是 chunk 组织策略，主要可改善共享和缓存复用。

```text
React.lazy → import() → Vite/Rollup 代码分割 → 运行时按需加载 chunk → React 渲染
```

[原始回答](./answer.md)
