# 第 11 天 · 第 10 题：订单创建幂等性与重复提交

**评分：60/100**

## 题目

```ts
// 前端
async function createOrder(productId: string) {
  return fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
}

// 后端伪代码
async function createOrder(req) {
  const { productId, quantity } = req.body;
  const order = await db.orders.insert({
    userId: req.user.id,
    productId,
    quantity,
    status: "pending",
  });
  return order;
}
```

用户提交后网络超时，前端重试；但第一次请求实际上已经创建订单。

1. 会出现什么问题？为什么禁用按钮不足以解决？
2. 如何保证同一次创建订单操作即使重试多次，也只创建一个订单？

## 一、核心问题：客户端无法知道超时请求是否成功

```text
客户端                      服务端
   | ---- POST 订单 ---->      |
   |                          | 创建订单 #101 成功
   | <--- 响应丢失 ---X        |
   |                          |
   | ---- 重试 POST ---->      |
   |                          | 创建订单 #102 成功（重复）
   | <--- 返回 #102 ----       |
```

**网络超时不等于服务端操作失败。** 禁用按钮只能减少用户界面上的重复点击，无法防止网络重试、移动网络切换、代理重试、并发请求或绕过前端直接调用接口。

这里的“幂等”是业务意义上的：**同一个逻辑操作执行多次，业务效果应与执行一次相同**。不同的正常购买操作，即使商品相同，也不应被误判为重复。

## 二、推荐方案：客户端幂等键 + 服务端原子去重

### 第一步：首次提交前生成幂等键

```ts
const idempotencyKey = crypto.randomUUID();

async function submitOrder(productId: string) {
  return fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
}

// 同一次业务操作的超时重试必须复用同一个 idempotencyKey。
// 用户主动发起另一笔独立订单时，应生成新的 key。
```

幂等键应在**首次发送前**产生，不能依赖首次响应返回的 ID，因为响应可能丢失。

### 第二步：数据库记录幂等键并建立唯一约束

以 PostgreSQL 为例：

```sql
CREATE TABLE order_idempotency (
  user_id BIGINT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  order_id BIGINT,
  response_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, idempotency_key)
);
-- PRIMARY KEY 保证同一用户的同一幂等键只能存在一条记录。
-- request_hash 用于防止同一 key 被不同请求参数复用。
-- order_id / response_json 保存成功结果供重试返回。
```

同一个用户的同一个 key 才代表相同逻辑操作。注意：真实系统需要认证、参数规范化与过期策略，避免恶意或意外复用。

### 第三步：用事务和唯一约束实现原子性

```text
BEGIN TRANSACTION
  |
  | 尝试 INSERT (user_id, key, request_hash)
  |       |
  |       +-- 唯一约束冲突：等待/读取已有结果并验证请求参数
  |       |
  |       +-- 首次插入成功：创建订单
  |                         |
  |                         +-- 写入 order_id / response_json
  |
COMMIT
```

**重要：**幂等登记和订单创建必须处于同一个数据库事务中，确保不会出现“登记成功但订单未创建”或“订单创建成功但幂等记录丢失”的不一致状态。

PostgreSQL 可使用 `INSERT ... ON CONFLICT DO NOTHING RETURNING ...` 判断是否获得创建权，配合事务与后续查询处理冲突。并发请求下，唯一索引负责仲裁；不能仅依赖应用层的“先查再插入”。

```ts
// ❌ 错误示例：存在检查-插入竞态
const existing = await db.findByKey(key);
if (!existing) {
  await db.orders.insert(order);
}
```

两个并发请求都可能读到“不存在”，然后各自创建订单。

### 第四步：重复请求返回原结果

- **同 key + 同参数 + 已成功：**返回原订单结果（包括原订单 ID）。
- **同 key + 不同参数：**拒绝复用（例如 HTTP 409）。
- **同 key + 正在执行：**可按协议等待、返回 409/处理中状态或 202，不能再次创建。
- **新 key：**视为新的业务操作，允许创建新订单。

具体状态码与响应格式属于 API 契约，客户端与服务端需保持一致。

## 三、用户提出的任务 ID 方案：有用，但不足以去重

```text
第一次 POST /api/order-tasks
    ↓
服务端创建 task A
    ↓
响应丢失
    ↓
客户端再次 POST
    ↓
服务端创建 task B
```

如果任务 ID 由服务端创建后才返回，那么**创建任务的请求本身也会遭遇相同的超时与重试问题**。单纯返回 taskId 并让前端轮询，只解决了异步状态查询，不解决任务创建幂等性。

正确组合：

```text
前端生成 idempotencyKey=K
    ↓
POST /api/order-tasks，携带 K
    ↓
服务端以 K 原子登记并创建 task A
    ↓
返回 taskId=A
    ↓
前端轮询 GET /api/order-tasks/A

如果首次响应丢失：
再次 POST，仍携带 K
    ↓
服务端返回原 taskId=A
```

### 异步任务的额外注意点

即使任务创建已去重，**队列消费者也可能重复执行**（例如消息至少一次投递、worker 崩溃后重试）。因此真正写入订单的消费者也要具备幂等保护，可用业务操作 ID 唯一约束，或事务内去重。

如果“登记任务”和“发布队列消息”跨数据库与消息队列，需考虑事务消息或 transactional outbox，避免数据库已提交但消息未发送的双写不一致。

## 四、不要把“同一商品”当成幂等判断条件

用户完全可能主动连续购买两次相同商品。不能仅用 `userId + productId` 唯一约束阻止重复购买。

应区分：

- **同一次逻辑提交的重试：**使用同一个幂等键。
- **两次独立购买：**使用不同的幂等键。

## 五、面试回答模板

> 创建订单时，客户端在首次请求前生成幂等键，并在超时重试时复用。服务端以 userId 和幂等键建立唯一约束，在数据库事务中原子地登记幂等键、创建订单并保存结果。相同 key 和参数的重复请求返回已有订单；不同参数复用同一 key 则拒绝。禁用按钮只能避免部分重复点击，不能替代后端幂等。若使用异步任务，任务创建和消费者执行也都需要幂等保护。

## 六、评分

**60/100**。第一问能识别重复创建订单的后果，也意识到前端限制不可靠，但把原因主要归于攻击者，遗漏正常网络重试。第二问提出任务 ID + 轮询，属于有价值的异步处理思路，但不能单独解决首次响应丢失后任务重复创建的问题。需补充客户端首次请求前生成幂等键、数据库唯一约束与事务。
