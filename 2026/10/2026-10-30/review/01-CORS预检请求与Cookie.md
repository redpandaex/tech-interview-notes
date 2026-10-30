# 专题一：CORS、预检请求与 Cookie

> 第 6 天面试复习 · 对应第 4 题（30/100）  
> 学习目标：能从浏览器安全模型、请求头、响应头、凭证与服务端配置五个角度解释跨域。

## 1. 先分清：同源策略与 CORS

**同源（Same Origin）**要求协议、主机名、端口全部相同。路径不参与同源判定。

| 页面地址 | 请求地址 | 是否同源 | 原因 |
|---|---|---|---|
| `https://a.example.com/app` | `https://a.example.com/api` | 是 | 协议、主机、端口相同 |
| `https://a.example.com` | `http://a.example.com` | 否 | 协议不同 |
| `https://a.example.com` | `https://api.example.com` | 否 | 主机不同 |
| `https://a.example.com` | `https://a.example.com:8443` | 否 | 端口不同 |

同源策略是浏览器安全边界，限制跨源脚本读取其他源的响应等操作。**跨源请求不等于请求无法发出**：许多跨源请求可以发送，但浏览器会依据 CORS 响应头决定 JavaScript 能否读取响应。

CORS（Cross-Origin Resource Sharing）是服务器通过 HTTP 响应头，向浏览器声明允许哪些源读取响应的机制。它不是服务器防火墙，也不是防止 Postman/curl 访问的身份认证方案。

## 2. 简单请求与预检请求

“简单请求”是口语化说法；规范中主要使用 **CORS-safelisted** 方法与请求头等条件。

典型满足条件的请求：

- 方法是 `GET`、`HEAD` 或 `POST`。
- 作者设置的请求头只使用允许的安全列表请求头，且值满足相关限制。
- `Content-Type` 若由代码设置，其媒体类型限于 `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain` 等安全列表类型；还有其他限制。

```js
// 通常不需要预检（但仍需要服务端返回 CORS 许可）
fetch('https://api.example.com/items');

// application/json 通常会触发预检
fetch('https://api.example.com/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Tom' }),
});
```

常见预检触发条件：`PUT`、`PATCH`、`DELETE`，或自定义请求头 `Authorization`、`X-Request-ID`，或 `Content-Type: application/json`。

**注意：** `Authorization` 请求头通常触发预检；`Cookie` 是浏览器控制的禁用请求头，不是通过 `headers: { Cookie: ... }` 随意设置的。

### 预检的完整流程

```text
浏览器准备发送跨源 PUT /users
    │
    ├─ OPTIONS /users
    │    Origin: https://app.example.com
    │    Access-Control-Request-Method: PUT
    │    Access-Control-Request-Headers: content-type,authorization
    │
    ├─ 服务器返回预检许可
    │    Access-Control-Allow-Origin: https://app.example.com
    │    Access-Control-Allow-Methods: GET,POST,PUT
    │    Access-Control-Allow-Headers: content-type,authorization
    │    Access-Control-Max-Age: 600
    │
    └─ 浏览器通过检查后才发送实际 PUT 请求
```

预检通常不携带跨源请求的 Cookie 等凭证。预检失败时，浏览器不会继续发送对应的实际请求。

## 3. 六个高频响应头

| 响应头 | 用途 |
|---|---|
| `Access-Control-Allow-Origin` | 允许读取响应的源；可以是具体源，或在不携带凭证时使用 `*` |
| `Access-Control-Allow-Methods` | 预检允许的请求方法 |
| `Access-Control-Allow-Headers` | 预检允许的请求头 |
| `Access-Control-Allow-Credentials: true` | 允许携带凭证的跨源响应被浏览器暴露给 JS |
| `Access-Control-Max-Age` | 浏览器可缓存预检许可的时间（有浏览器上限） |
| `Access-Control-Expose-Headers` | 允许 JS 读取额外的响应头 |

若服务端根据 `Origin` 动态返回 `Access-Control-Allow-Origin`，通常还应返回 `Vary: Origin`，避免共享缓存错误复用响应。

## 4. Cookie、credentials、SameSite：三套规则不要混

```js
fetch('https://api.example.com/me', {
  credentials: 'include',
});
```

`credentials` 常见取值：

- `omit`：不发送凭证，也不处理响应中的凭证。
- `same-origin`（默认）：仅同源请求发送凭证。
- `include`：允许跨源请求携带凭证，但仍受 Cookie 策略和浏览器隐私限制。

携带凭证的 CORS 请求，服务端需要类似：

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin
```

**不能把 `Access-Control-Allow-Origin: *` 与携带凭证的 CORS 响应配合使用。**

还要区分 **Origin（源）** 和 **Site（站点）**：同源要求协议+主机+端口一致；SameSite 使用的是站点概念（现代浏览器通常采用 schemeful site，考虑协议与可注册域名），因此 `app.example.com` 与 `api.example.com` 可能是跨源但同站。

Cookie 常见属性：

```http
Set-Cookie: session=abc; Path=/; HttpOnly; Secure; SameSite=None
```

- `HttpOnly`：阻止 `document.cookie` 读取该 Cookie，但不阻止浏览器在满足条件时随请求发送。
- `Secure`：通常仅在 HTTPS 等安全上下文传输。
- `SameSite=Lax/Strict/None`：控制跨站场景的 Cookie 发送。
- `SameSite=None` 通常必须同时设置 `Secure`。

**即使 CORS 设置正确，第三方 Cookie 限制、Cookie 的 Domain/Path/SameSite/Secure 等也可能阻止 Cookie 发送。**

## 5. CORS 与 CSRF 不一样

- CORS：限制跨源 JavaScript **读取响应**；并不保证恶意网页不能发起所有跨源请求。
- CSRF：攻击者诱使浏览器携带用户身份向目标网站发起非预期操作。
- 防 CSRF 仍需考虑 `SameSite`、CSRF Token、Origin 校验等；**不能把 CORS 当作 CSRF 防护的唯一措施**。

## 6. 排查清单（Chrome DevTools）

1. Network 中检查是否存在 `OPTIONS` 预检，查看 `Origin`、`Access-Control-Request-Method`、`Access-Control-Request-Headers`。
2. 检查预检响应的 `Access-Control-Allow-*` 是否匹配。
3. 检查实际请求是否携带 Cookie，查看 Request Headers 和 Cookies 面板中的阻止原因。
4. 检查 `credentials`、Cookie 的 SameSite/Secure/Domain/Path、浏览器第三方 Cookie 策略。
5. 区分网络失败、服务端 401/403、预检失败和浏览器拒绝暴露响应。

## 7. 面试速答（90 秒）

> CORS 是服务器通过响应头授权浏览器跨源读取响应的机制。同源判断协议、主机、端口。满足安全列表条件的跨源请求可直接发送实际请求；PUT、JSON Content-Type、自定义头等常触发 OPTIONS 预检，浏览器先验证服务器允许的方法和请求头。跨源携带 Cookie 需要前端 `credentials: 'include'`，服务端明确的 `Access-Control-Allow-Origin` 和 `Access-Control-Allow-Credentials: true`，还必须满足 Cookie 的 SameSite/Secure 等限制。CORS 不等于 CSRF 防护。

## 8. 自测题

1. `https://a.example.com` 请求 `https://api.example.com` 是跨源还是跨站？
2. 为什么 POST JSON 通常预检，而 POST `text/plain` 可能不预检？
3. `credentials: 'include'` 配合 `Access-Control-Allow-Origin: *` 会怎样？
4. 为什么设置了 CORS 仍可能没有 Cookie？
5. CORS 报错是否代表请求一定没有到达服务器？

**参考：** MDN 的 CORS、Fetch credentials、Set-Cookie 文档；Fetch Standard。