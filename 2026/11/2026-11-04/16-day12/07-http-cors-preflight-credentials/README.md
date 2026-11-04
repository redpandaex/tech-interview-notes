# 第 12 天 · 第 7 题：HTTP CORS、OPTIONS 预检与凭据请求

**方向：浏览器网络 / HTTP / 前后端分离**  
**难度：L2**  
**评分：83/100**

## 一、题目

前端在 `https://admin.example.com`，API 在 `https://api.example.com`。

```ts
fetch("https://api.example.com/orders", {
  method: "GET",
  headers: { Authorization: "Bearer xxx" },
});
```

问题：为什么跨源？为什么 GET 之前会出现 OPTIONS？排查哪些响应头？开发代理为何有帮助？

追问：
1. 浏览器预检询问 `authorization`，但服务端只允许 `Content-Type`，预检和实际 GET 会怎样？
2. 使用 `credentials: "include"` 时，为什么不能使用 `Access-Control-Allow-Origin: *`？

## 二、同源的定义

同源要求 **scheme（协议）、host（主机名）、port（端口）** 全部一致。

| 属性 | 前端 | API |
|---|---|---|
| scheme | https | https |
| host | admin.example.com | api.example.com |
| port | 443 | 443 |

Host 不同，因此跨源。`Origin` 本身由上述三个部分组成；不要把同源定义误写成 `scheme + origin + port`。

同源（same-origin）和同站（same-site）是两个概念。共享上级域名的两个子域名仍可能跨源。

## 三、为什么 GET 也有 OPTIONS？

并非所有跨源请求都预检。原题 GET 带有 `Authorization` 请求头，该头不属于 CORS 安全请求头列表，因此浏览器先发预检请求：

```http
OPTIONS /orders HTTP/1.1
Origin: https://admin.example.com
Access-Control-Request-Method: GET
Access-Control-Request-Headers: authorization
```

成功的预检响应示例：

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://admin.example.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 600
Vary: Origin
```

| 响应头 | 用途 |
|---|---|
| Access-Control-Allow-Origin | 声明允许的来源 |
| Access-Control-Allow-Methods | 声明允许的实际请求方法 |
| Access-Control-Allow-Headers | 声明允许的请求头 |
| Access-Control-Max-Age | 声明预检缓存时间，受浏览器限制 |
| Vary: Origin | 动态返回 Origin 时，帮助缓存正确区分响应 |

注意 `Access-Control-Allow-*` 是服务端**响应头**，`Access-Control-Request-*` 是浏览器在预检中发出的询问。

## 四、预检失败和实际响应失败的区别

假设浏览器询问：

```http
Access-Control-Request-Headers: authorization
```

但服务端只返回：

```http
Access-Control-Allow-Headers: Content-Type
```

浏览器发现 `Authorization` 未被允许，因此**预检失败，不会发送本次预检对应的实际 GET**。

| 场景 | 实际 GET 是否发送 | JS 能否读取响应 |
|---|---|---|
| 预检失败 | 否 | 否 |
| 预检通过，但实际响应 CORS 校验失败 | 是 | 否 |
| 两次校验均通过 | 是 | 是 |

这也是用户本题最需要纠正的知识点。

## 五、credentials: include 和通配符

前端：

```ts
fetch("https://api.example.com/orders", {
  credentials: "include",
});
```

以下配置无法让浏览器正常向 JS 暴露跨源响应：

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```

因为凭据模式为 include 时，允许来源不能是 `*`。应改成：

```http
Access-Control-Allow-Origin: https://admin.example.com
Access-Control-Allow-Credentials: true
Vary: Origin
```

如果服务端动态允许来源，应先验证请求 Origin 是否在可信白名单内，不能不加校验地回显所有 Origin。

`credentials: "include"` 不代表 Cookie 必然发送；Cookie 还受 Domain、Path、Secure、SameSite 和浏览器隐私策略等约束。

CORS 与 CSRF 也不同：CORS 限制跨源读取响应，不能取代 CSRF 防护。

## 六、开发代理与生产环境

开发环境可通过 Vite 的 `server.proxy` 将浏览器请求转为同源路径，再由开发服务器转发到 API：

```ts
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://api.example.com",
        changeOrigin: true,
      },
    },
  },
});
```

前端请求 `/api/orders` 时，浏览器只看到本地开发服务器的同源地址，因此没有直接向目标 API 发起跨源请求。此举**并不是关闭 CORS**。生产环境需要配置 API、网关或反向代理，或采用同源网关路径。

## 七、排查流程

1. 比较页面 URL 与 API URL 的 scheme、host、port，确认是否跨源。
2. 在 DevTools Network 找 OPTIONS，检查 `Origin`、`Access-Control-Request-Method`、`Access-Control-Request-Headers`。
3. 对照预检响应中的 Allow-Origin、Allow-Methods、Allow-Headers。
4. 如果预检成功，再检查实际响应的 CORS 头。
5. 对 Cookie 登录额外检查 credentials、Allow-Credentials、Cookie 属性。
6. 确认 API 服务、网关或鉴权中间件正确处理 OPTIONS。
7. 用浏览器验证；Postman 成功不能证明 CORS 配置正确，因为它通常不执行浏览器的同源安全限制。

## 八、面试参考答案

> 两个子域名 host 不同，所以跨源。GET 携带 Authorization 请求头，触发 OPTIONS 预检。浏览器在预检中询问来源、方法和请求头是否被允许；服务端要返回匹配的 Access-Control-Allow-Origin、Allow-Methods、Allow-Headers。预检失败时实际 GET 不会发送；预检成功但 GET 响应的 CORS 校验失败时，请求已发送但 JS 无法读取。若 credentials 为 include，Allow-Origin 不能是通配符，必须返回明确的受信任 Origin，并返回 Allow-Credentials:true。

## 九、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 25/30 |
| 解决方案 | 34/40 |
| 原理理解 | 16/20 |
| 边界意识 | 8/10 |
| **总分** | **83/100** |

用户正确理解跨源判断、CORS 响应头、开发代理与凭据请求的明确 Origin 要求；误区是认为预检失败后实际 GET 仍会发送。原始回答见 [answer.md](./answer.md)。
