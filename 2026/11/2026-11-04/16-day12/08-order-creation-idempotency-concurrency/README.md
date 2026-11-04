# 第 12 天 · 第 8 题：订单创建幂等性、并发控制与业务唯一性

**方向：全栈 / API 设计 / MySQL / 分布式并发**  
**难度：L2**  
**最终评分：76/100**

## 一、题目与业务背景

SaaS 订单系统前端提交：

```ts
async function createOrder(data: OrderInput) {
  return fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
```

服务端已创建订单，但响应在网络中丢失，客户端再次点击，导致两条相同订单。

主问题：
1. 前端如何减少重复提交？能否彻底解决？
2. 后端如何保证同一次创建操作只创建一条订单？
3. 两个相同请求同时到达不同后端实例，方案是否仍成立？

追问一：先查幂等 Key，再插入订单，最后写幂等记录的方案有什么竞态与崩溃风险？如何修复？

追问二：相同商品、不同幂等 Key 是否必然重复？如何确保同一次购物车结算只能产生一笔订单？

## 二、前端：减少重复提交，但不能作为唯一保障

用户点击按钮时可禁用按钮、显示 loading、限制重复提交。防抖可以降低快速点击带来的重复请求，但不等于可靠的防重机制。

React 示例：

```tsx
import { useRef, useState } from "react";

function CreateOrderButton({ data }: { data: OrderInput }) {
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);

  async function submit() {
    // 同步锁防止同一渲染周期内重复触发
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);

    try {
      // 一次操作创建一次 key；重试必须复用同一个 key
      const key = crypto.randomUUID();
      await createOrder(data, key);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return <button disabled={pending} onClick={submit}>创建订单</button>;
}
```

**示例的边界：** 上述代码只是防快速重复点击的基础示例；如果第一次请求结果不确定，不能在再次点击时无条件生成新 Key。真实业务应在操作开始时持久化该操作的 Key，并在确认结果前持续复用。页面刷新、多个标签页、客户端重试、网络超时以及其他客户端均可能绕过单纯的前端按钮控制。

## 三、幂等 Key 的设计

**原则：同一次业务操作复用同一个 Key，不同操作生成不同 Key。**

客户端可以在开始一次操作时生成随机 UUID：

```ts
const idempotencyKey = crypto.randomUUID();

async function createOrder(data: OrderInput, key: string) {
  return fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(data),
  });
}
```

第一次请求超时后，客户端重试时必须继续使用该 Key，而不是再次调用 `crypto.randomUUID()`。

**为什么客户端生成是合理的？** 客户端能标识自己发起的某一次业务操作。Stripe 等 API 使用由调用方提交幂等 Key 的模式。Key 不是身份认证凭据；服务端仍需鉴权和租户隔离。

后端通常要关联：
- `tenant_id` 或用户身份，作为 Key 的作用域。
- `idempotency_key`，唯一识别一次 API 操作。
- 请求参数摘要 `request_hash`，拒绝同一 Key 对应不同请求内容。
- 处理状态和业务结果，如 `order_id`、响应码/响应体（按实际需求）。
- 记录创建时间、过期时间等，用于管理保留窗口。

幂等 Key 的过期是清理策略，不是核心并发保证。支付等重要业务仍应依赖业务唯一约束。

## 四、数据库唯一约束 + 事务

示意表结构（MySQL）：

```sql
CREATE TABLE idempotency_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    idempotency_key VARCHAR(64) NOT NULL,
    request_hash CHAR(64) NOT NULL,
    order_id BIGINT NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 同一租户内同一个 Key 只允许存在一条记录
    UNIQUE KEY uk_tenant_idempotency (tenant_id, idempotency_key)
);

CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    checkout_id VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 同一次业务结算只允许创建一笔订单
    UNIQUE KEY uk_tenant_checkout (tenant_id, checkout_id)
);
```

**事务执行流程：**

1. 开启事务。
2. 尝试插入 `idempotency_records`，由数据库唯一约束仲裁同 Key 的并发请求。
3. 获得执行权后插入 `orders`，并更新幂等记录的 `order_id` 与完成状态。
4. 提交事务，使订单和幂等记录原子地成功或回滚。
5. 竞争失败的请求等待前一个事务完成，检查请求摘要，并按已提交状态返回原订单结果；若竞争事务回滚，则按约定重新尝试。

不能简单地认为“先 SELECT 再 INSERT”足够安全：

```text
实例 A：SELECT key → 不存在
实例 B：SELECT key → 不存在
实例 A：INSERT order 1001
实例 B：INSERT order 1002
```

这种 **Check-Then-Act** 竞态无法仅凭普通查询避免。唯一约束才是数据库层的原子仲裁机制。

### 为什么需要事务？

如果订单插入已经提交，但保存幂等记录之前服务崩溃：

```text
INSERT orders → 已提交
进程崩溃
INSERT idempotency_records → 未执行
客户端重试 → 查不到 Key → 再次创建
```

这时订单**没有丢失**，丢失的是幂等记录；两者不一致。把它们放进同一个事务可防止这种部分成功。

### 多实例并发是否需要显式数据库锁？

不一定。唯一索引配合数据库事务通常足够，数据库内部会完成并发冲突处理。复杂业务可能需要行级锁或其他并发控制，但不能把“加锁”当成唯一答案。

注意：若订单创建还涉及外部支付、消息发送等数据库外副作用，仅靠本地数据库事务不够；可结合事务 Outbox、消息消费幂等与业务状态机设计。

## 五、接口幂等与业务唯一性不同

追问示例：

```text
请求 A：
  Idempotency-Key: aaa
  商品：iPhone 17 × 1

请求 B：
  Idempotency-Key: bbb
  商品：iPhone 17 × 1
```

Key 不同，原则上代表两次独立 API 操作。**参数完全相同不代表用户没有下两次相同的订单**，不能单纯以商品、数量、金额去重。

但如果业务要求“同一次购物车结算只能创建一笔订单”，就需要在创建订单之前确定一个稳定的 `checkout_id` 或业务订单号。

```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    checkout_id VARCHAR(64) NOT NULL,

    -- 结算操作的业务唯一性
    UNIQUE KEY uk_checkout (tenant_id, checkout_id)
);
```

```text
checkout_001 → 请求 A → 创建订单 1001
checkout_001 → 请求 B → 唯一键冲突，返回订单 1001
checkout_002 → 请求 C → 允许创建新订单 1002
```

用户回答“订单 ID”需要限定含义：

- 如果是数据库插入时自动生成的自增 `order_id`，不能防止重复，因为重复创建会得到不同 ID。
- 如果是**创建请求之前就确定、同一次结算始终复用的业务订单号**，并有数据库唯一约束，则可以承担类似 `checkout_id` 的角色。

| 对比 | 接口幂等 Key | 业务结算 ID |
|---|---|---|
| 标识 | 一次 API 操作 | 一次业务结算 |
| 解决 | 请求重试重复执行 | 同一结算重复创建 |
| 示例 | `idempotency_key` | `checkout_id` |
| 同一次结算能否出现不同值 | 可能出现不同 Key | 必须保持相同 |

## 六、容易遗漏的边界

1. **同 Key 不同参数**：比对 `request_hash`，不应默默返回不匹配的旧结果。
2. **首个请求仍在处理中**：定义等待、返回处理中状态或冲突状态的行为；不能在结果尚未提交时直接假定成功。
3. **网络超时但服务端成功**：客户端使用原 Key 重试或查询订单状态。
4. **租户隔离**：Key 的唯一作用域通常包含 `tenant_id`，且租户身份必须来自已验证的上下文。
5. **过期与清理**：记录被清理后单靠 Key 可能不再防重，重要业务还需要业务唯一键。
6. **外部副作用**：数据库事务无法自动回滚外部支付或已发送消息，需独立幂等设计。
7. **响应复用**：按 API 约定决定返回同一业务结果或已缓存的响应，不要把唯一键异常直接暴露成不可理解的 500。

## 七、面试简答模板

> 前端可以禁用按钮、使用同步提交锁和复用请求 Key 来减少重复提交，但不能保证幂等。服务端应让客户端为一次业务操作生成稳定的 Idempotency Key，重试时复用，并在租户范围内建立唯一约束。创建订单与保存幂等记录要放在同一个数据库事务中，避免部分提交。两个实例并发时，数据库唯一索引能仲裁同 Key 的竞争，不能只靠先查后写。对于同一次购物车结算的业务唯一性，还需要预先生成 checkout_id 或业务订单号并建立唯一约束；相同商品参数不代表同一笔订单。

## 八、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 25/30 |
| 解决方案 | 27/40 |
| 原理理解 | 16/20 |
| 边界意识 | 8/10 |
| **总分** | **76/100** |

用户理解前端限制、幂等 Key、事务和锁的方向；需加强唯一索引对并发的作用、事务的原子性，以及“接口操作标识”和“业务结算标识”的区分。
