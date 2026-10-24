# Day 1 · 第 6 题：qiankun、Module Federation 与微前端治理

## 场景
20 个 React/Vue 子应用，存在样式污染、依赖重复、路由混乱、资源加载失败。是否迁移 Module Federation？如何治理和迁移？

## 标准答案
- **qiankun**：应用级加载、挂载/卸载、沙箱和路由协调；适合异构系统集成。
- **Module Federation**：跨独立构建共享模块及依赖，提供 remote/shared 等运行时机制；不是完整微前端应用生命周期与样式隔离方案。两者可结合。
- **样式隔离**：命名空间、CSS Modules、qiankun 的 experimentalStyleIsolation（选择器作用域）或 strictStyleIsolation（Shadow DOM）；还要处理 Portal、样式继承等。
- **依赖共享**：Monorepo 管理代码与依赖版本，不代表浏览器运行时自动共享。可用 externals 或 Module Federation shared；React 与 react-dom 的版本、实例需配套。
- **路由**：主应用提供统一的导航服务 API、权限与状态协议，子应用内自行路由，避免泄漏宿主路由框架的私有 API。
- **迁移决策**：衡量加载性能、故障率、插件生态、Vue2 等旧技术栈兼容性、团队维护成本、迁移收益及可回滚能力。不是所有问题都需要通过迁移解决。
- **React 运行时**：React 18 应用可评估共享版本兼容实例；React 17/18 不应仅为缩包盲目强制共享。共享的 React Hooks 与渲染器的实例兼容性很重要。
- **线上白屏**：逐层确认资源 404/MIME/publicPath、版本/CDN、bootstrap/mount/unmount、沙箱和依赖实例、路由 basename、异常监控。加载成功不代表挂载成功。
- **发布**：带哈希的不可变静态资源、先资源后入口、保留旧 Chunk、灰度监控和入口版本快速回滚。

## 代码
参见 [examples/navigation-service.ts](examples/navigation-service.ts) 和 [examples/mount-instrumentation.ts](examples/mount-instrumentation.ts)。

## 参考
- https://qiankun.umijs.org/guide
- https://module-federation.io/guide/start/
