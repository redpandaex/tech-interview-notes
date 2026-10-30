# 第 7 天 · 第 3 题：浏览器存储、XSS、CSRF 与 Token 刷新

**评分：49/100**

## 题目

1. 比较 Cookie、localStorage、sessionStorage 的生命周期、自动携带、隔离规则和敏感凭证风险。
2. 解释 HttpOnly、Secure、SameSite=Lax；比较 XSS、CSRF 和防御机制。
3. 分析 Access Token/Refresh Token 的存储安全、刷新流程、10 个请求同时 401 的并发处理。

## 参考答案

### 一、浏览器存储

| 维度 | Cookie | localStorage | sessionStorage |
|---|---|---|---|
| 生命周期 | Expires/Max-Age 或会话结束 | 通常持久保存，直到主动清理等 | 页面会话结束 |
| 自动随请求发送 | 满足域、路径、安全、SameSite、credentials 等条件时 | 否 | 否 |
| 作用域 | Domain/Path 等规则 | Origin（实际还受浏览器存储分区等策略影响） | Origin + 页面会话（顶层浏览上下文） |

sessionStorage 刷新页面通常保留；存在 opener 关系时新页面可能复制初始数据，之后各自独立。localStorage 的主要敏感凭证风险是同源恶意 JS（如 XSS）可以直接读取，长期持久化还增加暴露窗口。

### 二、Cookie 属性与 XSS/CSRF

- **HttpOnly**：阻止 document.cookie 直接读取/修改该 Cookie；不能阻止恶意 JS 在登录用户上下文发起认证请求。
- **Secure**：限制 Cookie 经安全连接发送，通常 HTTPS。
- **SameSite=Lax**：限制跨站 Cookie 携带，但跨站顶层安全方法导航等场景仍可能携带；不能完全防 CSRF。

**XSS**：攻击者使恶意脚本在受害网站上下文执行。防御包括正确输出编码、HTML 净化、CSP、避免不安全 innerHTML。

**CSRF**：诱导受害者浏览器携带现有身份凭证发起非预期请求，攻击者无需读取 Cookie。防御包括 CSRF Token、Origin/Referer 校验、SameSite，以及避免 GET 修改状态。

**Cross-Origin ≠ Cross-Site**。子域名不同可以跨源但同站。

### 三、Token 生命周期

- Access Token 通常短期有效；Refresh Token 通常较长，用于签发新 Access Token，需更严格保护。
- 两者都放 localStorage 可能被 XSS 直接读取。
- HttpOnly Cookie 降低直接窃取风险，但仍需处理 CSRF、Cookie 范围、跨源 credentials/CORS、过期和会话撤销。
- 收到 Access Token 过期的 401 后，请求刷新接口；成功则保存新 Token 并重试原请求；失败则统一清理认证状态，要求重新登录。刷新接口不能进入无限刷新循环，原请求需要一次重试限制。
- 可采用 Refresh Token Rotation（刷新后轮换并撤销旧 Refresh Token）。

### 四、并发 401：共享 Promise

```ts
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken()
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
```

10 个请求同时返回 401 时，所有请求等待同一个刷新 Promise，成功后各自重试。布尔 flag 只阻止重复刷新，无法自然让其余请求等待结果。还需处理刷新成功后旧 401 到达的竞态、登出与刷新并发、多标签页同步及非幂等请求重试。

## 关键复习点

1. XSS 与 CSRF 是不同攻击模型。
2. HttpOnly 防读取，不防恶意脚本借用现有会话执行操作。
3. SameSite=Lax 不是万能 CSRF 防御。
4. 单次并发刷新使用共享 Promise / Single Flight。
5. localStorage、Cookie 的安全性取决于威胁模型，不存在仅靠一种存储方式解决全部安全问题。

[用户原始回答](./answer.md)
