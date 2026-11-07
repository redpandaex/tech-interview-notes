# 第 13 天 · 第 4 题：Source Map 与生产环境错误监控

**方向：Webpack / 构建工程化 / CI/CD / 错误监控**  
**难度：L1–L2**  
**评分：86/100**

## 一、Source Map 是什么？

Source Map 是生成代码到原始源码的位置映射文件。它常用于 TypeScript、Babel 转换、代码压缩和合并后的调试。

原始 TS：

```ts
function add(a: number, b: number) {
  return a + b;
}
console.log(add(1, 2));
```

压缩后的 JS 可能变成一行，变量名也可能被改写。Source Map 记录生成代码位置与原始文件、行列、名称之间的对应关系，供浏览器 DevTools 或错误监控平台还原。

常见字段包括 sources、mappings、names，以及可选的 sourcesContent。映射数据通常使用 Base64 VLQ 编码。它通常是独立的 .map 文件，而不是简单把行列号附加在 JS 中。

## 二、Webpack devtool 选项

| 配置 | 特点 | 常见用途 |
|---|---|---|
| source-map | 独立完整映射文件，支持行列映射，通常添加引用注释 | 高质量调试、错误还原 |
| eval-source-map | 模块通过 eval 包装，映射质量高，开发重建体验较好 | 开发环境 |
| cheap-module-source-map | 只映射行，不映射列，并考虑 Loader 转换前的源码映射 | 开发环境 |
| hidden-source-map | 生成独立 .map，但不在 JS 中添加 sourceMappingURL 注释 | 生产环境私有错误监控 |

记忆：
- eval：使用 eval 包装模块，通常偏开发体验。
- cheap：映射粒度较粗，通常只有行级映射。
- module：考虑 Loader 之前的源码映射。
- hidden：隐藏 JS 中的引用注释，不是加密、删除文件或访问控制。

不同 devtool 选项在构建速度、重建速度和映射精度上有取舍，实际配置应结合 Webpack 版本文档。

## 三、生产环境是否应该生成 Source Map？

需要区分“生成”和“公开”：
- 可以在生产构建中生成 Source Map，以支持线上错误还原。
- 通常不应将完整 Source Map 公开给普通用户，因为它可能暴露源码路径、名称和 sourcesContent 中的源码。
- CI 应将 .map 上传到 Sentry 等错误监控平台，再从公开部署目录排除 .map。

推荐流程：

```text
CI 构建 JS/CSS 和 .map
       ↓
上传 .map 到 Sentry，关联 Release / Debug ID
       ↓
从公开部署产物中排除 .map
       ↓
部署 HTML、JS、CSS
       ↓
线上错误上报文件名、行列和版本信息
       ↓
Sentry 使用匹配的 Source Map 还原源码位置
```

Webpack 示例：

```js
module.exports = {
  mode: "production",
  devtool: "hidden-source-map",
};
```

## 四、为什么 Source Map 必须与构建版本匹配？

V1 和 V2 的源代码、依赖、压缩结果和模块布局可能不同，因此生成代码的位置映射也不同。

```text
V1: main.abc123.js:1:58231
    → V1 Source Map → src/utils.ts:20:10

V2: main.def456.js:1:58231
    → V2 Source Map → src/order.ts:85:16
```

不能用 V2 的 Source Map 解析 V1 的堆栈。即使行列号相同，也不代表映射到相同源码位置。版本不匹配可能造成错误文件、行列和函数名归因错误，或完全无法解析。

可以使用 Git Commit SHA、CI Build ID、Sentry Release / Dist、资源路径或 Debug ID 关联产物。用户提出的“毫秒时间戳 + Hash + 版本号”也能设计成唯一标识，但通常不必全部组合。核心是同一次构建的 JS 与 Source Map 成对，错误上报能找到正确构建。

## 五、hidden-source-map 为什么仍可能被下载？

假设 dist 中有：

```text
dist/
├── index.html
├── main.abc123.js
└── main.abc123.js.map
```

如果整个目录公开部署到 Nginx，访问 /main.abc123.js.map 仍可能下载。

因为 hidden-source-map 只是不在 JS 文件中添加 sourceMappingURL 引用注释：
- 不会删除 .map 文件。
- 不会把 .map 文件加密。
- 不会限制 Nginx 的 HTTP 访问。

**隐藏引用不等于隐藏文件。**

## 六、CI/CD 与 Nginx 防护

推荐流程：
1. CI 构建生成 JS/CSS 和 Source Map。
2. 上传 .map 到 Sentry，关联 Release、Debug ID 和资源路径。
3. 验证上传成功，确保监控平台能匹配对应 JS。
4. 从公开部署目录或部署包中排除 .map 文件。
5. 部署 HTML、JS、CSS 等运行所需资源。
6. Nginx 额外拒绝 .map 请求，作为纵深防御。

Nginx 示例：

```nginx
location ~* \.map$ {
    return 404;
}
```

最稳妥的是 CI/CD 本身不把 Source Map 复制到公开目录；Nginx 拦截是额外防线，不应是唯一措施。

## 七、面试简答模板

> Source Map 是转换后代码到原始源码的位置映射文件，可以把压缩 JS 的行列位置还原到 TS/JS 源码。Webpack 的 source-map 生成独立映射文件；eval-source-map 偏开发调试；cheap-module-source-map 只做行级映射；hidden-source-map 不在 JS 中添加映射引用，但仍会生成 map 文件。生产环境可以生成 Source Map 用于 Sentry 还原错误，但应在 CI 中上传到监控平台，并从公开部署目录排除。每次构建要用 Release、Commit SHA 或 Debug ID 等信息，确保 JS 和 Source Map 精确匹配。hidden-source-map 不负责访问控制，若 map 仍部署在公开目录，仍可通过 URL 下载。

## 八、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 26/30 |
| 解决方案 | 35/40 |
| 原理理解 | 17/20 |
| 边界意识 | 8/10 |
| **总分** | **86/100** |

用户理解 Source Map 的映射用途、版本匹配的重要性、隐藏映射文件不等于禁止访问，以及将 .map 从公开部署产物中分离的 CI/CD 方案。初始对 devtool 选项不熟悉，经讲解后掌握核心区别。
