# 第 5 天 · 第 4 题：HTTP 缓存与条件请求

日期：2026-10-28
评分：85/100

## 题目

首次请求 /static/app.js，服务器响应：

```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=3600
ETag: "abc123"
Last-Modified: Wed, 21 Oct 2026 08:00:00 GMT
Content-Type: application/javascript
```

1. 30 分钟后再次访问是否发请求？
2. 2 小时后如何处理？ETag、Last-Modified 各自作用？
3. 请求 If-None-Match: "abc123"，资源未变化时返回什么？浏览器如何处理？
4. no-cache 和 no-store 有何区别？

## 完整参考答案

### 1. 30 分钟后

`max-age=3600` 是 60 分钟的新鲜度生命周期。正常缓存命中、非强制刷新的情况下，30 分钟后可直接复用缓存，无需向服务器发请求。缓存年龄计算还会考虑 Date、Age 等响应信息，不能一律简单理解为浏览器收到响应的时间加 max-age。

### 2. 2 小时后

响应超过显式新鲜度生命周期，浏览器一般进行条件请求重新验证：

```http
GET /static/app.js HTTP/1.1
Host: example.com
If-None-Match: "abc123"
If-Modified-Since: Wed, 21 Oct 2026 08:00:00 GMT
```

- ETag：资源版本验证标识；请求使用 If-None-Match。
- Last-Modified：资源最后修改时间；请求使用 If-Modified-Since。
- 两个条件请求头都存在时，支持 If-None-Match 的服务器优先处理它。
- **注意拼写：If-Modified-Since，而不是 If-None-Modified。**
- 本题有显式 max-age，不需要额外考虑启发式新鲜度延长。

### 3. 304 Not Modified

资源未变化时返回 304，无响应体。浏览器根据 304 更新缓存元数据，并复用已存储的 JS 响应体。资源变化时一般返回 200 和新响应体。

### 4. no-cache 与 no-store

- `Cache-Control: no-cache`：**允许存储响应**，但每次复用前必须向源服务器验证；未变化可收到 304 并复用本地响应体。
- `Cache-Control: no-store`：指示 HTTP 缓存不要存储该响应供后续复用。

不要把 no-cache 误解为“完全不缓存”。

## 评分

| 问题 | 得分 |
|---|---:|
| 30 分钟后缓存 | 25/25 |
| 2 小时后条件请求 | 25/30 |
| 304 处理 | 20/20 |
| no-cache 与 no-store | 15/25 |
| **总分** | **85/100** |

## 参考资料

- MDN HTTP caching: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
- MDN Cache-Control: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
- MDN If-Modified-Since: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Modified-Since

用户原始回答见 [answer.md](./answer.md)。
