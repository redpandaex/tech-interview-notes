# 第 13 天 · 第 5 题：Webpack Entry、Output、Mode 与公共依赖拆分

**方向：Webpack / 多入口构建 / splitChunks / Tree Shaking**  
**难度：L1–L2**

## 一、题目

项目目录：

```text
src/
├── admin/index.ts
├── mobile/index.ts
└── shared/utils.ts
```

配置：

```js
module.exports = {
  entry: {
    admin: "./src/admin/index.ts",
    mobile: "./src/mobile/index.ts",
  },
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  mode: "production",
};
```

问题：
1. entry、output、mode 分别负责什么？
2. 为什么生成两个入口 Bundle？两个入口都引用 shared/utils.ts 时会怎样？
3. [name] 和 [contenthash] 分别是什么？为什么使用 contenthash？

追问：
1. splitChunks 的 chunks: "all" 与默认 async 有什么区别？
2. 提取 common.js 后，两个入口是否都需要加载？
3. 公共 common.js 很大时是否合理？如何进一步优化？

## 二、Entry、Output、Mode

- **entry**：指定构建入口。Webpack 从入口开始递归分析依赖图。多入口对象的 key 是入口名称。
- **output**：控制构建产物的输出目录、文件名等。
- **mode**：指定 development、production 或 none，影响 Webpack 默认优化和相关行为。

示例中会有 admin 和 mobile 两个入口 Chunk。

## 三、共享模块会不会重复？

如果 admin 和 mobile 都静态导入 shared/utils.ts，Webpack 能识别它们引用的是同一个模块，但默认情况下该模块可能分别出现在两个入口 Chunk 中。

```text
admin.js
├── admin/index.ts
└── shared/utils.ts

mobile.js
├── mobile/index.ts
└── shared/utils.ts
```

可通过 splitChunks 提取公共依赖，避免在多个输出 Chunk 中重复包含同一份代码。

## 四、[name] 与 [contenthash]

```js
output: {
  filename: "[name].[contenthash].js",
}
```

- **[name]**：入口或 Chunk 的名称，例如 admin、mobile；不是原始文件名。
- **[contenthash]**：根据输出内容生成的 Hash。内容变化时，通常会生成不同的 URL。

这样未变化的资源可以继续复用浏览器缓存；变化的资源使用新 URL，避免拿到旧内容。

## 五、splitChunks 的 chunks 选项

Webpack 5 中常见取值：

| 值 | 范围 |
|---|---|
| async | 只考虑异步 Chunk，是默认值 |
| initial | 只考虑初始加载 Chunk |
| all | 同时考虑初始和异步 Chunk |

`all` 扩大了可拆分的 Chunk 范围，但不代表所有公共模块必然会被提取；仍受模块大小、缓存组、请求开销等条件影响。

例如：

```js
optimization: {
  splitChunks: {
    chunks: "all",
  },
}
```

如果公共依赖被提取成 common.js，实际依赖它的入口都需要加载它。admin 页面加载 admin.js 和 common.js；mobile 页面加载 mobile.js 和 common.js。若用户在同一个页面会话中先后加载两个入口，已加载模块也可能由运行时复用；跨页面或刷新时则还会受到浏览器 HTTP 缓存影响。

## 六、Tree Shaking 与 splitChunks 不冲突

**核心区别：**
- **Tree Shaking**：分析未使用的导出，尽可能删除无用代码。
- **splitChunks**：决定模块最终如何分组到不同 Chunk。
- 两者可以同时启用，不是二选一。

Webpack 5 生产模式会启用相关优化。可显式配置：

```js
module.exports = {
  mode: "production",
  optimization: {
    usedExports: true,
    minimize: true,
    sideEffects: true,
    splitChunks: {
      chunks: "all",
    },
  },
};
```

- `usedExports`：标记哪些导出被使用。
- `minimize`：启用压缩器，压缩器可根据使用信息删除无用代码。
- `sideEffects`：结合 package.json 的副作用声明判断模块能否安全跳过。
- `splitChunks`：拆分公共依赖。

Tree Shaking 通常要求静态可分析的 ESM 导入导出，并且模块副作用信息准确。CommonJS、动态访问导出、错误的 sideEffects 声明等都可能影响效果。

### 示例

```ts
// utils.ts
export function formatDate() {
  return "2026-11-07";
}

export function formatMoney() {
  return "100.00";
}

export function formatAddress() {
  return "Shanghai";
}
```

Admin 只导入 formatDate，Mobile 导入 formatDate 和 formatMoney。若 formatAddress 没有被使用，Tree Shaking 可以移除它。

但公共 Chunk 必须满足所有使用它的入口，因此可能保留 formatDate 与 formatMoney 的并集。

## 七、公共 Chunk 很大时怎么办？

Tree Shaking 不会自动把所有模块按用户访问场景拆成最小 Chunk。若一个公共依赖被多个入口使用，提取后的公共 Chunk 仍可能较大。

可考虑：

1. **合理拆分模块**：将 date、money、address 等功能拆为独立模块，避免一个大模块强耦合。
2. **动态 import / React.lazy**：将不需要首屏加载的路由或功能延迟加载。
3. **调整 cacheGroups**：按依赖类型、体积和复用情况拆分，而不是把所有 node_modules 强行放进一个 vendor。
4. **检查 Tree Shaking 条件**：使用 ESM 入口，检查 package 的 sideEffects 元数据，避免副作用声明错误。

## 八、四种技术的区别

| 技术 | 解决的问题 | 主要粒度 |
|---|---|---|
| Tree Shaking | 删除未使用代码 | Export / 模块 |
| Code Splitting | 按加载时机拆分代码 | Chunk |
| splitChunks | 提取和复用公共依赖 | Module / Chunk |
| Lazy Loading | 延迟加载资源 | 组件 / 模块 |

## 九、面试简答模板

> Entry 指定依赖图入口，Output 控制构建产物输出，Mode 决定构建模式和默认优化。多入口会分别形成入口 Chunk，共享模块可能被重复包含，可以通过 splitChunks 提取公共依赖。chunks: all 同时考虑初始和异步 Chunk，默认 async 主要处理异步 Chunk。Tree Shaking 与 splitChunks 不冲突：前者删除未使用导出，后者调整模块所在 Chunk。公共 Chunk 过大时，可以拆分模块、使用动态 import 做路由级加载，并合理配置 cacheGroups。

## 十、用户回答与反馈摘要

- Entry / Output / Mode：回答正确。
- 两个入口引用同一共享模块可能重复进入各自 Chunk：回答正确；补充 splitChunks 可提取公共模块。
- [name] 是入口名称，[contenthash] 根据内容生成：用户对 contenthash 理解正确，但最初误以为 name 是原始文件名。
- chunks: all：用户最初不记得；补充为 async / initial / all 的区别。
- 两个入口都依赖 common.js：回答正确。
- common.js 过大不一定合理：回答正确。
- 用户提出 Tree Shaking 进一步拆分：方向接近但概念需区分；Tree Shaking 是删除未使用代码，不是 Chunk 拆分机制。

