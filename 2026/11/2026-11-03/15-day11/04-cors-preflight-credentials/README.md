# 第 11 天 · 第 4 题：CORS 预检与携带凭据

**评分：40/100**

## 题目

页面源为 `https://app.example.com`，请求 `https://api.example.com`：

```js
fetch("https://api.example.com/user", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "X-Token": "abc123",
  },
  body: JSON.stringify({ name: "test" }),
});
```

后端响应：

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Token
```

问题：

1. 是否发送 `OPTIONS` 预检？为什么？
2. 假设预检已通过，能否读取实际响应？如何修正？

## 一、预检请求与简单请求

**本题会触发预检**，但不能只因为“跨域”就推断必定预检。

浏览器对跨域请求实施 CORS 检查。符合特定条件的简单请求（更准确地说，CORS-safelisted 请求）通常不需要预检，例如普通跨域 GET。

本题需要预检，关键在于：

- `Content-Type: application/json` 不属于 CORS-safelisted Content-Type 值。允许的典型值是 `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain`（还受其他约束）。
- `X-Token` 是自定义请求头，不属于 CORS-safelisted 请求头。
- `POST` 方法本身并不必然触发预检。
- `credentials: "include"` 本身并不必然触发预检。

### 预检流程

```text
浏览器（Origin: https://app.example.com）
  |
  | OPTIONS /user
  | Origin: https://app.example.com
  | Access-Control-Request-Method: POST
  | Access-Control-Request-Headers: content-type,x-token
  v
API 服务器
  |
  | Access-Control-Allow-Origin: https://app.example.com
  | Access-Control-Allow-Methods: POST
  | Access-Control-Allow-Headers: Content-Type, X-Token
  | Access-Control-Allow-Credentials: true
  v
浏览器校验预检
  |
  | 通过后发送实际 POST
  v
API 服务器返回实际响应
  |
  | 浏览器再次进行 CORS 校验
  v
前端 JavaScript 才能读取响应
```

预检通常不携带跨域请求的凭据；服务端应允许预检请求本身。对于需要凭据的实际请求，预检响应也须满足相关 CORS 校验要求。

## 二、携带凭据不能配合通配符 Origin

题目设置：

```js
credentials: "include"
```

但服务端返回：

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```

**不合法**。当请求的 credentials mode 为 include 时，`Access-Control-Allow-Origin` 不得为 `*`，必须明确返回允许的来源。

例如：

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Token
Vary: Origin
```

- `Access-Control-Allow-Origin`：必须是具体、受信任的来源（不能把任意 Origin 无条件反射回去）。
- `Access-Control-Allow-Credentials: true`：允许携带凭据的跨域响应被前端读取。
- `Vary: Origin`：如果服务端根据请求 Origin 动态生成 ACAO，建议用于避免共享缓存混用不同来源的响应。
- **实际响应也需要正确的 CORS 响应头**；预检成功不意味着实际响应自动可读。

即使实际 HTTP 请求在服务器侧执行成功、返回 200，浏览器仍可能因 CORS 校验失败而阻止 JavaScript 读取响应。

### 其他常见边界

- `credentials: "include"` 允许浏览器在跨域 fetch 中按适用规则携带凭据，并不保证 Cookie 一定被发送。Cookie 仍受 Domain、Path、Secure、SameSite、第三方 Cookie 策略等限制。
- `app.example.com` 与 `api.example.com` 是**不同源**（origin），但通常属于同一站点（site）；跨源和跨站不是同一概念。
- CORS 是浏览器限制脚本读取跨源响应的机制，不是服务端认证授权的替代品。
- 服务端也可以通过避免非安全列出头部等方式让某些请求无需预检，但不能绕过对实际响应的 CORS 校验。

## 三、事件委托补充：target 与 currentTarget

用户在本题回答前还问了上一题的 `target` / `currentTarget`。

- `event.target`：事件最初命中的目标节点。
- `event.currentTarget`：当前正在执行该监听器的节点。

```html
<div id="list"><button data-id="1"><span>删除</span></button></div>
```

```js
list.addEventListener("click", (event) => {
  // 点击 span 时，target 是 span，currentTarget 是 list。
  const button = event.target.closest("button");
  if (!button || !list.contains(button)) return;
  console.log(button.dataset.id);
});
```

直接 `event.target.matches("button")` 在点击按钮内部 span 时会失败；`closest()` 更稳妥。

## 四、评分

**40/100**。

- 预检判断“会”正确，但理由“因为跨域”不充分：并非所有跨域请求都预检。
- 判断响应头“可以”错误，未识别 `credentials: "include"` 与 `Access-Control-Allow-Origin: *` 的冲突。
- 复习重点：预检触发条件与实际响应的 CORS 凭据校验是两个独立判断。
