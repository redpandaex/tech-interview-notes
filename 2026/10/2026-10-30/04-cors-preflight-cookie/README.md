# 第 6 天 · 第 4 题：CORS、预检请求与 Cookie

**评分：30/100**

## 题目

前端 https://admin.example.com，后端 https://api.example.com，发起：

```ts
fetch("https://api.example.com/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer abc123",
  },
  credentials: "include",
  body: JSON.stringify({ name: "Tom" }),
});
```

1. 同源策略、是否同源、CORS 和预检条件。
2. OPTIONS 预检的请求头和允许请求的响应头；通配符与 credentials 的兼容性。
3. credentials、SameSite 三种取值、Lax Cookie 能否用于两个子域名之间的请求。

## 参考答案

### 1. 同源与 CORS

Origin 由协议（scheme）、主机名（host）、端口（port）组成。两个不同子域名不同源。浏览器同源策略不等于一律禁止发送跨源 HTTP 请求；CORS 通过服务器的响应头控制跨源响应是否可供 JavaScript 读取。

简单请求不需预检；POST 本身不必然预检，但 Content-Type: application/json 不是 CORS 简单请求允许的 Content-Type，Authorization 也不是简单请求头，因此本题触发 OPTIONS。credentials: include 本身不必然触发预检。

### 2. 预检

浏览器大致发送：

```http
OPTIONS /users HTTP/1.1
Origin: https://admin.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization,content-type
```

服务器允许时可返回：

```http
Access-Control-Allow-Origin: https://admin.example.com
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600
```

实际 POST 响应也要有相应 CORS 许可头。带凭证的 CORS 请求不能使用 Access-Control-Allow-Origin: *；需要具体 Origin 及 Allow-Credentials: true。预检请求本身通常不携带 Cookie。

### 3. Cookie、跨源与跨站

credentials: omit 不使用凭证；same-origin 仅同源使用（默认）；include 允许跨源凭证，但是否发送 Cookie 仍取决于 Domain、Path、Secure、SameSite 等属性。

Strict 只在同站请求发送；Lax 同站请求可发送，跨站时部分顶级导航也允许；None 不因 SameSite 阻止跨站发送，通常需 Secure。

https://admin.example.com 和 https://api.example.com 虽然不同源，但协议相同、可注册域名均为 example.com，属于同站。因此 SameSite=Lax 本身不阻止 admin 页面向 api 发起的请求携带 Cookie。假设 Cookie 作用域匹配 api.example.com、HTTPS、credentials: include 且无其他浏览器限制，则可以携带。

## 附加问题：Event.eventPhase 和 React 17

Event.eventPhase 是浏览器原生只读属性，Event.AT_TARGET 是常量 2；其他常量：NONE=0、CAPTURING_PHASE=1、BUBBLING_PHASE=3。React 17 将大多数事件委托从 document 改到根容器，改善多版本 React、非 React 代码及嵌套应用的兼容性。微前端及 Web Components 可能涉及类似事件传播问题，但无法从描述确认具体 issue。

## 评分

| 维度 | 得分 |
|---|---:|
| 同源策略与 CORS 基础 | 22/35 |
| OPTIONS 预检机制 | 3/35 |
| Cookie 与 SameSite | 5/30 |
| **总分** | **30/100** |

[原始回答与评价](./answer.md)
