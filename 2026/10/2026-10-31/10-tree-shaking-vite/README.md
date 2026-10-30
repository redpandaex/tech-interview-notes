# 第 7 天 · 第 10 题：Tree Shaking、代码分割与 Vite

**评分：84/100**

## 1. Tree Shaking

Tree Shaking 基于 ESM 静态模块结构，分析导入导出并尝试移除未使用代码。未引用的 multiply 通常可以移除，但受优化配置、静态分析和副作用约束，不保证一定删除。顶层 console.log 有可观察副作用，普通 Tree Shaking 不应直接删除它。

package.json 的 sideEffects:false 是向打包工具声明未使用的模块可以被跳过，不代表所有函数调用没有副作用。CSS 导入通常有副作用，可使用 sideEffects:["*.css"] 保留。

## 2. 动态导入、React.lazy、Suspense

静态 import 在模块顶层声明依赖；动态 import() 返回 Promise，允许运行时异步加载模块。动态 import 常用作代码分割点，但不保证独立 JS Chunk，最终取决于构建配置和合并策略。

React.lazy 接受返回模块 Promise 的加载函数；Suspense 在支持挂起的子树中显示 fallback。Suspense 不会自动跟踪任意 useEffect 请求的 pending 状态。

代码分割可减少非首屏代码的初始加载成本，但如果拆分首屏关键代码，可能增加请求数量、加载瀑布和模块执行开销；不是 Chunk 越多越好。

## 3. Vite、依赖预构建与 HMR

Vite 开发模式利用浏览器原生 ESM，按需转换和提供源码模块，通常不必在启动时打包整个应用，因此冷启动快。仍可能需要依赖预构建：一方面将 CommonJS 等依赖转为可加载 ESM，另一方面整合大量细碎依赖以减少请求。

HMR 在修改后替换受影响模块，通常不需要整页刷新；React Fast Refresh 在满足条件时尝试保留组件状态，但不能保证所有修改都能保留状态。

生产构建不仅为了兼容性，还包括 Tree Shaking、代码压缩、合理分 Chunk、CSS 资源优化、内容哈希缓存和减少加载瀑布。

## 评分明细

| 考察项 | 得分 |
|---|---:|
| Tree Shaking 与 ESM | 13/15 |
| 副作用与 sideEffects | 13/15 |
| 静态与动态 import | 9/10 |
| React.lazy 与 Suspense | 9/10 |
| 代码分割与首屏性能 | 6/10 |
| Vite 开发模式 | 10/10 |
| 依赖预构建 | 10/10 |
| HMR | 9/10 |
| 生产构建优化 | 5/10 |
| **合计** | **84/100** |

[用户原始回答](./answer.md)
