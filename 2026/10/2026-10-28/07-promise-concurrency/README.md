# 第 5 天 · 第 7 题：Promise.all、allSettled 与 race

**日期：** 2026-10-28
**评分：50/100**

## 题目

```js
const p1 = fetch("/api/user");
const p2 = fetch("/api/orders");
const p3 = fetch("/api/notifications");
```

1. Promise.all、Promise.allSettled、Promise.race 的区别？
2. Promise.all 中 p2 被拒绝，p1/p3 是否自动取消？为什么？
3. 三个接口同时请求，允许部分失败且展示其他成功数据，选择什么方式？给出代码。

## 参考答案

### 三种 API

| API | 完成条件 | 结果 |
|---|---|---|
| Promise.all | 全部兑现则兑现；任意一个拒绝则拒绝 | 全部成功值的数组，顺序与输入一致 |
| Promise.allSettled | 全部 Promise 敲定（兑现或拒绝） | 每个结果的对象数组，顺序与输入一致 |
| Promise.race | 第一个 Promise 敲定 | 采用第一个敲定 Promise 的结果或拒绝原因 |

```js
await Promise.all([
  Promise.resolve("A"),
  Promise.resolve("B")
]); // ["A", "B"]

await Promise.allSettled([
  Promise.resolve("A"),
  Promise.reject("B failed")
]);
// [{status:"fulfilled", value:"A"}, {status:"rejected", reason:"B failed"}]

await Promise.race([
  new Promise(resolve => setTimeout(() => resolve("A"), 3000)),
  new Promise(resolve => setTimeout(() => resolve("B"), 1000))
]); // "B"
```

`Promise.all` 不负责启动请求；在执行 `fetch()` 时请求就已开始。三个聚合 API 只是观察并组合已有 Promise 的状态。

### 失败不会自动取消其他请求

`Promise.all([p1,p2,p3])` 如果 p2 拒绝，聚合 Promise 拒绝，但 p1/p3 仍会继续执行。要取消 fetch，需通过 `AbortController` 显式传递 signal 并调用 abort。另：fetch 收到 HTTP 404/500 通常仍兑现，需检查 response.ok 并主动抛错。

### 部分失败场景：allSettled

```ts
async function parseResponse(response: Response) {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadDashboard() {
  const results = await Promise.allSettled([
    fetch("/api/user").then(parseResponse),
    fetch("/api/orders").then(parseResponse),
    fetch("/api/notifications").then(parseResponse),
  ]);

  const [user, orders, notifications] = results;

  if (user.status === "fulfilled") renderUser(user.value);
  if (orders.status === "fulfilled") renderOrders(orders.value);
  if (notifications.status === "fulfilled") renderNotifications(notifications.value);
}
```

对于 `PromiseSettledResult`，使用 `status === "fulfilled"` 可以在 TypeScript 中收窄到包含 `value` 的结果，否则可访问 `reason`。

## 评分

| 考察点 | 得分 |
|---|---:|
| 三种 API 的区别 | 10/40 |
| Promise.all 失败后是否取消其他请求 | 25/25 |
| 部分失败的处理 | 15/35 |
| **总分** | **50/100** |

错误：把 all 误解为任意一个完成即返回；把 allSettled 误解为只返回最后一个；把 race 误解为等到最后一个才返回；第 3 问缺少示例代码。原始回答见 [answer.md](./answer.md)。
