# 第 4 天 · 第 2 题：Markdown 富文本 XSS 与 CSP

日期：2026-10-27 ｜状态：进行中（第一轮追问已完成，等待后续追问）｜初步评分：**45/100**，第一轮追问：**90/100**（不是最终分）

## 题目

React 知识库用 marked 解析 Markdown，随后通过 dangerouslySetInnerHTML 渲染：

```tsx
const html = marked.parse(content) as string;
return <div dangerouslySetInnerHTML={{ __html: html }} />;
```

1. 解释漏洞原因、React 转义机制、存储型与 DOM 型 XSS。
2. 保留 Markdown 和部分 HTML 的安全渲染方案、链接/图片处理、前后端职责。
3. `Content-Security-Policy: script-src 'self'` 的含义、局限及第三方脚本兼容问题。

## 参考答案

### React 自动转义与 dangerouslySetInnerHTML

`<div>{content}</div>` 将普通字符串作为文本插入，React 会转义 HTML 特殊字符，不会把 `<img onerror=...>` 创建为真实元素。

`dangerouslySetInnerHTML={{ __html: content }}` 则将内容作为 HTML 解析，不会自动对输入进行 HTML 安全清理。即使 innerHTML 插入的 script 标签通常不会直接执行，也可能通过事件属性、危险 URL 等产生 XSS。

marked 负责 Markdown 转 HTML，不是 HTML Sanitizer。数据库保存恶意 Markdown 后，其他用户打开触发，是典型的存储型 XSS；DOM 型描述客户端不安全数据流进入 DOM Sink 的机制，二者的分类维度不完全相同。

### HTML 安全处理

推荐解析 Markdown 后用成熟的 DOMPurify 等 Sanitizer 清理 HTML，再插入 DOM。按照业务允许标签和属性，限制 `javascript:` 等危险 URL 协议；链接 `target="_blank"` 应配合 `rel="noopener noreferrer"`；图片来源可限制 HTTPS/可信 CDN/图片代理，并考虑跟踪和隐私风险。

```tsx
import { marked } from "marked";
import DOMPurify from "dompurify";

function MarkdownPreview({ content }: { content: string }) {
  const rawHtml = marked.parse(content, { async: false }) as string;
  const safeHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["iframe", "object", "embed", "form", "style"],
    FORBID_ATTR: ["style"],
  });
  return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
```

示例配置需按真实业务调整。后端应负责鉴权、校验以及各输出路径的安全处理；保留原始 Markdown、在 HTML 输出边界执行适当 Sanitization 通常更合理，不能一律在存储时转义所有 HTML。

### CSP

`script-src 'self'` 约束脚本来源与执行，不是限制所有网络请求；`connect-src` 约束 fetch/XHR/WebSocket 等连接。CSP 不能替代 Sanitization。第三方脚本或内联脚本可能被拦截，必要时采用合适的可信来源、Nonce、Hash 等策略，不宜简单放开 `unsafe-inline`。

## 用户额外提问：同源与跨域（已纳入本题问答）

**用户原话：**「然后我想问一下,同源和跨域都是限定了相同的URL和端口吗?(这个也记录到问答当中)」

### 答案

**同源不是完整 URL 相同，而是协议（Scheme）+ 主机（Host）+ 端口（Port）均相同。** 路径、查询参数、Fragment 不影响同源判断；省略端口按协议默认端口计算（HTTPS 443，HTTP 80）。

以 `https://app.example.com:443/users/123` 为基准：

| URL | 同源？ | 理由 |
|---|---|---|
| `https://app.example.com/users/456` | 是 | 路径不影响 |
| `https://app.example.com:443/orders` | 是 | HTTPS 默认端口 443 |
| `https://app.example.com/?id=1#home` | 是 | 查询与哈希不影响 |
| `http://app.example.com/users` | 否 | 协议不同 |
| `https://app.example.com:8443/users` | 否 | 端口不同 |
| `https://api.example.com/users` | 否 | 子域名/主机不同 |
| `https://example.com/users` | 否 | 主机不同 |

常说的“跨域”在浏览器 CORS 场景通常指“跨源”；`localhost:5173` 和 `localhost:8080` 也跨源。CORS 是服务器声明允许哪些跨源读取；同源策略限制跨源交互；CSP 是页面对资源加载/连接/执行的限制。CORS 不一定阻止请求发送，可能只阻止 JS 读取响应；CSP 的 `connect-src 'self'` 则会阻止不符合策略的跨源 fetch 连接。

以 `https://app.example.com` 和 `script-src 'self'; connect-src 'self'` 为例：
- 同源 `https://app.example.com/main.js`：允许（就给定 CSP 而言）。
- 跨源 `https://cdn.other.com/sdk.js`：被 script-src 阻止。
- `fetch("https://api.other.com/users")`：被 connect-src 阻止。

## 评分进度

初步回答 45/100；第一轮追问 90/100；最终评分待定。

参考：
- https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
- https://github.com/cure53/DOMPurify
