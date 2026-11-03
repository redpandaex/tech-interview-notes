# 第 11 天 · 第 4 题：用户原始回答与评分

**最终评分：40/100**

## 题目

前端从 `https://app.example.com` 发出携带 `credentials: "include"`、`Content-Type: application/json` 和 `X-Token` 的跨源 POST，请求服务端响应包含：

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Token
```

问题：是否预检，为什么？假设预检通过，前端能否正常读取实际响应，如何修改？

## 用户原始回答（原文）

> 如果使用target如何判断呢?currentTarget指的是当前点击的元素,target指的是触发的元素?
>
> 1. 会,因为跨域了
> 2. 应该可以吧,看着没啥问题啊

## 反馈

### 上一题追问：事件目标

- `event.target` 指事件目标；`event.currentTarget` 指当前执行监听器的节点，通常是委托容器。
- 使用 `event.target.closest("button")` 从目标或其祖先中找到按钮，比直接 `target.matches("button")` 更适合包含内部子元素的按钮。

### 第 1 问：预检

- 判断“会”正确。
- “因为跨域”不是充分理由：简单跨源请求通常无需预检。
- 本题触发预检的关键是 `application/json` 和自定义 `X-Token` 请求头。

### 第 2 问：携带凭据

- 判断“可以”错误。
- `credentials: "include"` 与 `Access-Control-Allow-Origin: *` 不兼容。
- 应将允许的 Origin 设置为明确来源 `https://app.example.com`，保留 `Access-Control-Allow-Credentials: true`，并确保预检及实际响应按要求返回 CORS 响应头。

## 最终评分

**40/100**。需要区分“触发 OPTIONS 预检的条件”和“携带凭据时浏览器能否读取响应的条件”。

详细参考答案见 [README.md](./README.md)。
