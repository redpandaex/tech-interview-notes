# Day 1 · 第 5 题：Vite 与 Webpack 构建原理

## 题目

1. Vite 在开发环境为何通常比传统 Webpack 启动快？模块加载和 HMR 如何工作？
2. Vite 依赖预构建解决哪些问题？
3. 开发快意味着生产构建一定快吗？

## 参考答案

- Vite 开发模式利用浏览器原生 ESM，不必启动时把全部应用源码打包。浏览器访问模块时，由 Vite 按需转换 TS/TSX 等源码与改写模块导入路径；动态 `import()` 对应的模块通常等到实际执行时加载。
- 依赖预构建与源码按需转换不同：预构建可完成 CommonJS/UMD 依赖的 ESM 兼容转换，并合并依赖内部大量细碎模块以减少开发环境请求数；同时缓存预处理结果。
- HMR：文件变化后开发服务器依据模块依赖图定位受影响模块及可接受更新的 HMR 边界，再通知浏览器请求更新后的模块；React 项目通常配合 Fast Refresh。不能接受热更新的情况可能退化为整页刷新。
- 传统 Webpack 开发模式通常先构建 Bundle，但 Webpack 也支持持久化缓存、增量构建、HMR，以及实验性的 `experiments.lazyCompilation`。
- 生产构建速度取决于模块图、转换、插件、代码分割、Source Map、压缩、I/O 等因素。不要由开发冷启动表现推断生产构建必然更快。
- 版本辨析：早期 Vite 的依赖预构建/部分转换依靠 esbuild（Go），生产构建依靠 Rollup（主要 JS）；Vite 8 转向 Rolldown（Rust）及 Oxc（Rust）构建处理体系。具体行为以项目所用版本为准。

## 可运行示例

- [examples/main.ts](examples/main.ts) — 动态加载入口
- [examples/editor.ts](examples/editor.ts) — 延迟加载模块

在浏览器 ESM 环境下，实际工程可使用 Vite 启动示例。TypeScript 源码需要经过 Vite 等转换后交给浏览器。

## 复习要点

1. 启动快的核心是**开发模式不必预先打包整个应用**，不是“不编译”。
2. 浏览器原生 ESM 的模块请求与 Vite 按需转换一起驱动加载。
3. HMR 依赖模块图与更新边界，不等同于按需加载。
4. 不要把 Rollup、esbuild 和 Rolldown 的实现语言弄混。

## 参考

- https://vite.dev/guide/why.html
- https://vite.dev/guide/dep-pre-bundling.html
- https://vite.dev/guide/api-hmr.html
- https://webpack.js.org/configuration/experiments/#experimentslazycompilation
