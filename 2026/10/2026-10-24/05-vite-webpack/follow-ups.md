# 第 5 题 · 追问与回答记录

## 第一轮

**用户回答：** Vite 开发时使用 esbuild、生产使用 Rollup（听说已换 Rolldown）；开发和生产可能有差异；预构建用于加快速度；生产构建不一定更快，误以为 Rollup 是 Rust 编写。

**点评：** 了解工具链演进，但 Vite 开发时仍会按需转换代码。依赖预构建核心是 CommonJS/UMD 兼容与合并大量依赖子模块。Rollup 主要是 JavaScript，esbuild 是 Go，Rolldown 是 Rust。

## 第二轮

**用户回答：** 1000 个组件不需要全部提前转换；浏览器加载首页可能有延迟；Webpack 5 有实验性的延迟编译功能；Vite 通过依赖分析知道加载范围；Home.tsx 修改无需重新打包是因为按需加载。

**点评：** 第一点和 Webpack lazyCompilation 的认识正确。需补充浏览器原生 ESM 的请求链、Vite 转换与模块图，HMR 时使用模块更新和接受边界，并非只靠按需加载。

## 模拟评分

75/100。重点复习原生 ESM、依赖预构建、HMR 边界和生产构建工具链。
