# 第 12 天 · 第 10 题：Vite Hash 静态资源缓存、动态导入失败与 Nginx SPA 回退

**方向：前端工程化 / Vite / HTTP 缓存 / Nginx / 部署**  
**难度：L2**  
**最终评分：82/100**

## 一、题目

React + Vite SaaS 管理系统构建产物：

```text
dist/
├── index.html
└── assets/
    ├── index-a1b2c3.js
    ├── index-d4e5f6.css
    └── OrderPage-789abc.js
```

其中 `OrderPage-789abc.js` 是动态 `import()` 加载的路由模块。

初始 Nginx 配置：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /assets/ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

用户长时间停留在旧版页面。新版本部署时删除旧文件 `OrderPage-789abc.js`，仅保留 `OrderPage-fed321.js`。用户点击订单管理后，旧版 JS 仍请求旧 Chunk，出现 `Failed to fetch dynamically imported module`。

主问题：
1. 为什么有 Hash 和一年强缓存仍会失败？
2. `index.html` 和 Hash JS/CSS 应使用什么缓存策略？
3. 部署流程如何减少旧 Chunk 丢失？

追问：如果错误地把缺失的 `/assets/*.js` 回退为 `index.html`，响应为 `200 OK` 且 `Content-Type: text/html`，为什么动态 `import()` 仍然失败？缺失静态资源应返回 404 还是 SPA HTML？

## 二、Hash 解决缓存区分，不解决旧版本文件可用性

```text
10:00 旧页面打开
      加载旧入口 JS，但未访问订单管理路由

11:00 新版本部署
      删除 OrderPage-789abc.js
      上传 OrderPage-fed321.js

12:00 用户点击订单管理
      旧入口 JS 仍引用 OrderPage-789abc.js
      浏览器本地没有可用的旧 Chunk 缓存
      请求服务器 → 文件不存在 → 加载失败
```

关键区别：

- **Hash 文件名**：内容变化时 URL 改变，允许对相同 URL 使用长期强缓存，避免新旧内容互相污染。
- **长期强缓存**：只对浏览器**已经缓存且仍可用**的资源有效。浏览器可能从未请求过该动态 Chunk，也可能已清理缓存。
- **旧页面的运行时引用**：不会因为服务器部署了新版本而自动改写为新 Hash；不刷新页面时，旧 JS 仍然持有旧 Chunk 的 URL。
- **部署时删除旧文件**：导致旧页面首次加载旧 Chunk 时无法从服务器取得资源。

不能简单理解为“只有 index.html 更新才会请求其他资源”：动态 `import()` 可以在页面已经运行很久后才触发独立的资源请求。

## 三、推荐缓存策略

| 资源 | 示例 Cache-Control | 目的 |
|---|---|---|
| HTML 入口 | `no-cache` | 可以存储，但再次使用前要向服务端验证是否有更新 |
| 带内容 Hash 的 JS/CSS | `public, max-age=31536000, immutable` | 文件名变化代表新版本，可长期缓存 |
| 未带 Hash 的运行时配置 | 视更新要求使用 `no-cache` 或更短 TTL | 避免部署后读取过时配置 |

**术语区分：**
- `no-cache` 不代表禁止缓存，而是再次使用前必须验证。
- `no-store` 才是要求不要存储响应。
- `immutable` 表示资源在新鲜期内预计不会改变，适合内容寻址的 Hash 资源。
- `max-age` 决定响应的新鲜期；资源在缓存中是否实际存在还受浏览器缓存管理、清理和容量限制。

## 四、Nginx 示例

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/app/dist;
    index index.html;

    # HTML 入口：再次使用前检查版本
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    # 静态文件：不存在时明确返回 404
    location ^~ /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # SPA 路由：真实文件找不到则返回 HTML 入口
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 配置解释

1. `root /var/www/app/dist;`：设置静态文件根目录，URI 映射到构建产物。
2. `location = /index.html`：精确匹配 HTML 入口，指定重新验证策略。
3. `location ^~ /assets/`：匹配构建静态资源；`^~` 可避免后续正则 location 抢走匹配（具体仍需结合完整配置）。
4. `try_files $uri =404;`：如果静态文件不存在，明确返回 404，**不回退到 index.html**。
5. `add_header Cache-Control ...`：为带 Hash 资源设置长期强缓存。
6. `location /` 中的 `try_files $uri $uri/ /index.html;`：用于 React Router 等 History API 的客户端路由深链接回退。

**注意：** 原题已经有独立的 `location /assets/`，常规静态文件处理下缺失的 JS 会返回 404。追问中“返回 index.html”是额外假设，通常发生在没有独立静态资源 location、错误的 fallback 配置、CDN 重写规则等情况下。

**另一注意：** 同时配置 `expires 1y;` 和显式 `add_header Cache-Control ...` 可能导致重复 Cache-Control 响应字段。建议选择一致且清晰的写法，不要不必要地重复设置。

## 五、HTTP 200 为什么仍无法作为 JS 模块执行？

假设浏览器请求：

```http
GET /assets/OrderPage-789abc.js HTTP/1.1
```

服务器却返回：

```http
HTTP/1.1 200 OK
Content-Type: text/html
```

```html
<!DOCTYPE html>
<html>
  <body>...</body>
</html>
```

HTTP 200 仅说明 HTTP 请求成功返回了响应，不代表内容符合客户端期望。

**ES Modules 使用严格 MIME 类型检查。** 浏览器期望 JavaScript 模块的有效 MIME 类型，例如 `text/javascript`，却得到 `text/html`，因此拒绝加载，出现类似：

```text
Failed to load module script:
Expected a JavaScript module script but
the server responded with a MIME type of "text/html".
```

对于 CSS，错误地返回 HTML 也可能触发样式表 MIME 类型错误。若响应头伪装成 JavaScript 但实际内容是 HTML，则可能出现 JS 语法解析错误。**状态码、MIME 类型、响应体内容必须分别理解。**

## 六、前端路由回退与静态资源 404 的边界

### 前端路由

```text
GET /orders/123
  → Nginx 未找到对应文件
  → 返回 index.html
  → 浏览器运行 React
  → React Router 解析 /orders/123
  → 呈现订单详情或 SPA 内部 404 页面
```

### 静态资源

```text
GET /assets/OrderPage-789abc.js
  → Nginx 未找到文件
  → 返回 HTTP 404
  → 浏览器将其识别为资源加载失败
  → 应用可以执行恢复或提示更新
```

**不能让缺失的 JS/CSS 以 200 + HTML 的方式“成功”返回。** 这会混淆路由请求与资源请求，并造成误导性的 MIME 错误。

## 七、部署流程改进

1. **保留旧 Hash 资源**：新版本发布时只新增资源，不立即删除旧 Chunk。旧版页面仍可获取旧路径。
2. **先上传资源，后切换 HTML**：避免 HTML 引用尚未发布的 JS/CSS。可使用带版本目录、对象存储/CDN 或原子切换。
3. **保持 CDN 和多实例一致性**：避免不同节点的入口和资源版本不匹配。
4. **建立旧资源清理策略**：根据最长会话时间、可接受的兼容窗口和实际访问情况，保留多个版本；重要业务可长期保留不可变 Hash 资源。
5. **动态导入失败恢复**：捕获路由加载错误，提示用户刷新或重新打开；不要无条件自动刷新形成死循环。
6. **必要时做版本检测**：例如应用定期或在窗口重新获得焦点时检查版本标识，提示用户存在新版本。版本检测是体验优化，不能代替旧资源留存。
7. **后端接口兼容窗口**：旧前端页面仍在运行，后端 API 变更也应考虑兼容旧版客户端。

### 可选的动态 import 恢复示例

```ts
async function loadOrderPage() {
  try {
    return await import("./OrderPage");
  } catch (error) {
    // 提示用户存在可能的版本变更，并由用户决定刷新
    // 不能把所有 import 失败都视为新版本：也可能是网络故障
    showRefreshPrompt(error);
    throw error;
  }
}
```

## 八、面试简答模板

> Vite 的内容 Hash 解决缓存失效和版本区分，但不会让旧页面运行中的动态 import URL 自动变更。如果新部署删除旧 Chunk，而用户未缓存过它，旧页面访问路由时就会请求不存在的文件。index.html 通常用 no-cache 便于版本重新验证，Hash JS/CSS 用长期 max-age 和 immutable。部署时应先发布新静态资源，再切换 HTML，保留旧 Hash 文件一段时间，并保持 CDN/多实例一致。SPA 的路由路径可以回退 index.html，但不存在的 JS/CSS 必须返回 404，不能返回 200 + text/html，因为浏览器对 ES 模块执行严格 MIME 类型检查。

## 九、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 25/30 |
| 解决方案 | 34/40 |
| 原理理解 | 15/20 |
| 边界意识 | 8/10 |
| **总分** | **82/100** |

用户正确掌握 no-cache、Hash 资源强缓存、旧版本资源留存，以及 SPA 路由和静态资源 404 的区分。主要需要加强旧页面的动态模块引用生命周期和浏览器严格 MIME 类型检查的原理。
