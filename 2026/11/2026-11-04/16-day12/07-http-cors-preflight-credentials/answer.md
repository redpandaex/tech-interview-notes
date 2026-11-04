# 第 12 天 · 第 7 题：原始回答、追问与评分

**最终评分：83/100**

## 主问题：跨源、OPTIONS 预检和响应头

**题目：** 前端 `https://admin.example.com` 请求 `https://api.example.com/orders`，GET 带 Authorization，浏览器出现 OPTIONS；为什么跨源、为什么预检，如何排查？

### 用户原始回答

> 哦哦哦,难怪,我就说我没太看懂,确实是
>
> 1. 同域名的定义就是schema+origin+port都要相同,因为需要判断服务端是否允许跨域
> 2. Allow-xxx开头的那些,理论上需要服务端设置请求头,但是开发阶段可以不用后端操心

**反馈：** 同源标准是 scheme + host + port；Authorization 头触发预检；Allow-* 是服务端响应头，开发代理可以让浏览器改为同源请求。

## 第一次追问：预检响应未允许 Authorization

**题目：** OPTIONS 的 Access-Control-Request-Headers 为 authorization，但响应 Access-Control-Allow-Headers 只有 Content-Type。预检是否通过？实际 GET 是否发送？

### 用户原始回答

> 1. 不能吧,headers的值不一样
> 2. 预检失败还会发送,但是不会处理返回结果了,会显示跨域错误

**反馈：** 第 1 问正确；第 2 问不正确。预检失败时浏览器不发送对应的实际 GET；实际请求已发送但 JS 不能读取是另一类 CORS 响应检查失败。

## 第二次追问：credentials:include 与通配符

**题目：** fetch 使用 credentials:include，响应 Allow-Origin:* 与 Allow-Credentials:true，是否可行？如何修改？

### 用户原始回答

> 1. 不能
> 2. 应该设置具体的域名吧,我记得应该是

**反馈：** 两问正确。应返回 `Access-Control-Allow-Origin: https://admin.example.com` 和 `Access-Control-Allow-Credentials: true`。如果按白名单动态返回 Origin，建议配合 `Vary: Origin`。

## 最终评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 25/30 |
| 解决方案 | 34/40 |
| 原理理解 | 16/20 |
| 边界意识 | 8/10 |
| **总分** | **83/100** |

详细参考答案：[README.md](./README.md)。
