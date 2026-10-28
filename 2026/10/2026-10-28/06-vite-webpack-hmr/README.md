# 第 5 天 · 第 6 题：Vite、Webpack 与 HMR

日期：2026-10-28
评分：68/100

## 题目

大型 React 项目从 Webpack 迁移 Vite：

1. 为什么 Vite 开发服务器启动通常更快？开发模块处理方式有什么不同？
2. 为什么使用原生 ESM 还需要依赖预构建？
3. React 组件修改后 Vite HMR 如何工作？与整页刷新有何不同？

## 参考答案

### 1. 开发服务器启动

传统 Webpack 打包型开发服务通常先构建应用依赖图并打包，才提供应用资源。Vite 在开发阶段把工作分为两类：业务源码通过浏览器原生 ESM 按需请求与转换；第三方依赖预构建并缓存。因此不用在启动时预先打包所有业务源码。按需加载可能使首次访问某些页面产生额外转换/请求开销，但不意味着必然比 Webpack 慢。

### 2. 依赖预构建的两个核心目的

- **CommonJS / UMD 兼容**：将非 ESM 依赖转换为浏览器可加载的 ESM。
- **请求性能**：将拥有大量内部 ESM 文件的依赖合并，减少浏览器请求数量。例如 lodash-es 的大量内部模块。

Vite 还会将 `import React from "react"` 等裸模块导入重写为浏览器可请求的 URL。SCSS/Less 等属于源码转换或插件处理，不是依赖预构建的主要目的。

版本注意：旧版 Vite 依赖预构建使用 esbuild；当前 Vite 文档描述使用 Rolldown，不应把旧版实现当作所有版本的事实。

### 3. HMR

文件变化 → Vite 定位受影响模块与 HMR 边界 → WebSocket 通知浏览器 → 浏览器请求更新后的 ESM 模块 → HMR 接受并应用更新。React Fast Refresh 能在满足条件时保留部分组件状态；如果无法安全热替换，可能需要重挂载或整页刷新。WebSocket 负责通知，不是直接传送完整替换代码的唯一方式。

与整页刷新相比，HMR 尽量只更新受影响模块并减少状态丢失；整页刷新会重新加载页面资源、通常丢失运行时状态。

## 评分

| 维度 | 得分 |
|---|---:|
| Vite 与 Webpack 开发模式 | 30/35 |
| 依赖预构建 | 10/35 |
| HMR 原理 | 28/30 |
| **总分** | **68/100** |

## 官方资料

- https://vite.dev/guide/why.html
- https://vite.dev/guide/dep-pre-bundling.html
- https://vite.dev/guide/features

原始回答见 [answer.md](./answer.md)。
