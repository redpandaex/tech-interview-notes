# 第 8 天 · 第 2 题：Cookie、XSS 与 CSRF

**评分：67/100**

## 1. Cookie 安全属性

- **HttpOnly**：阻止 document.cookie 读取/修改 Cookie，但符合条件的请求仍自动发送该 Cookie。
- **Secure**：通常仅通过 HTTPS 发送 Cookie，不阻止 XSS。
- **SameSite=Strict**：跨站请求通常不发送 Cookie。
- **SameSite=Lax**：同站请求正常发送；允许符合条件的跨站顶层安全方法导航（例如点击链接的 GET），不允许普通跨站 fetch POST 携带。
- SameSite 以 **site** 而不是 **origin** 为判断单位；现代浏览器考虑 scheme（协议）。同站子域不一定同源。
- 浏览器从第三方网站导航到目标网站时，发送的是**目标网站自己的 Cookie**，不是把第三方网站的 Cookie 传给目标网站。
- credentials:include 不能绕过 SameSite 限制。

## 2. XSS

dangerouslySetInnerHTML 将不可信字符串解释为 HTML，可能允许事件处理属性等执行恶意代码。例如图片加载失败触发 onerror。通过 innerHTML 插入的 script 标签通常不会直接执行，但其他向量仍可能执行，取决于 CSP 等限制。

React 的 {content} 默认按文本安全渲染，不把用户字符串解析成 HTML。HttpOnly 只能降低会话 Cookie 被直接读取的风险，不能阻止恶意脚本在当前登录上下文发起请求、读取页面可访问数据、操作 DOM。

防护：
1. 默认按文本输出；避免不可信 HTML 进入危险 DOM sink。
2. 确需富文本时使用成熟 Sanitizer（如 DOMPurify）按允许标签和属性清理，不要只靠 script 标签黑名单。
3. 合理配置 CSP，限制脚本执行；CSP 是纵深防御，不代替安全输出。
4. 校验危险 URL 等非文本上下文。

## 3. CSRF

CSRF 是攻击者诱导用户浏览器向**用户已经登录的目标网站**发起非预期请求。浏览器可能自动附加**目标网站**的 Cookie，攻击者不必读取或知道 Cookie 值。Cookie 不是发送给攻击者网站。

CORS 主要控制跨源脚本读取响应与部分请求的预检，并非通用 CSRF 防护；HTML 表单可以发起某些跨站请求。

SameSite 不能单独替代所有 CSRF 防护：同站不等于同源，Lax 允许部分跨站顶层导航，系统可能需要 SameSite=None；不应通过 GET 修改状态。跨站 iframe 并不能天然绕过 SameSite=Lax。

### CSRF Token 工作流程

1. 服务端生成足够随机、不可预测的 Token，并绑定用户会话（或采用安全的签名双提交等设计）。
2. 通过同源页面或受保护接口把 Token 提供给前端，避免跨站攻击者读取。
3. 前端在敏感请求的请求头（如 X-CSRF-Token）或表单字段中携带 Token。
4. 服务端验证会话和 Token 的有效性，不匹配则拒绝操作。

通常可配合 Origin/Referer 校验与 SameSite 防护。XSS 可能绕过 CSRF Token 保护，因此仍需防 XSS。

### Bearer Token

如果系统完全依赖 JS 显式设置 Authorization: Bearer <token>，且没有自动携带的其他认证凭据，恶意站点无法让浏览器自动为目标网站请求附加该 Token，因此通常没有传统 Cookie 型 CSRF 风险。但仍可能存在 XSS、Token 泄露等其他风险。

## 评分

| 项目 | 得分 |
|---|---:|
| HttpOnly、Secure | 9/10 |
| SameSite | 10/20 |
| XSS 原理 | 15/15 |
| XSS 防护 | 8/10 |
| CSRF 原理 | 10/15 |
| SameSite 与 CSRF | 6/10 |
| CSRF Token | 0/10 |
| Bearer Token 与 CSRF | 9/10 |
| **总分** | **67/100** |

[用户原始回答](./answer.md)
