# 第 5 天 · 第 7 题：原始回答与评分

**评分：50/100**

## 用户原始回答（逐字保留）

> 1. all是同时发送,任意一个结束就返回,allSettled是等到所有Promise结束才返回,并返回最后一个,race是等到最后一个结束时,返回第一个结束的promise
> 2. 不会
> 3. allSettled

## 评价

1. **10/40**：三种 API 的结束条件混淆。all 全部成功才兑现、任意一个失败就拒绝；allSettled 等全部敲定并返回每项状态与结果；race 由第一个敲定的 Promise 决定结果。
2. **25/25**：正确判断不会自动取消其他请求。原因是聚合 Promise 的拒绝不会取消底层 fetch；取消需 AbortController。
3. **15/35**：正确选择 allSettled，但没有按题目要求写示例代码。实际业务应遍历 status 并提取成功值；fetch 的 HTTP 错误需显式检查 response.ok。

完整参考答案见 [README.md](./README.md)。
