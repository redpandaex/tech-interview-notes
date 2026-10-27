# 第 4 天 · 第 1 题：TypeScript 类型安全的异步状态机

日期：2026-10-27 ｜最终评分：**75/100** ｜状态：完成（两轮追问）

## 题目

React 订单详情有 idle、loading、success、error 四种互斥状态。原始代码：

```ts
interface Order {
  id: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
}

interface OrderState {
  loading: boolean;
  data?: Order;
  error?: string;
}
```

1. 指出类型与业务状态缺陷。
2. 重设计状态类型，保证成功时有数据、失败时有错误。
3. 新增 cancelled 状态时，让漏处理的分支在编译期报错。

## 标准答案：状态建模

多个布尔值、可选字段会允许 loading=true 且 error/data 同时存在，或“成功”但无 data。调整 UI 的判断顺序不能从类型层面禁止非法状态。

使用可辨识联合类型（Discriminated Union）：

```ts
type OrderState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Order }
  | { status: "error"; error: string };
```

在 `state.status === "success"` 时，TS 将类型收窄到含有必填 `data` 的分支；在 error 分支可安全访问 `error`。判别字段也可以是布尔字面量 `success: true | false` 对应的不同对象分支，而不是宽泛的 `boolean` 字段。

## 穷尽检查

```tsx
function assertNever(value: never): never {
  throw new Error(`Unexpected state: ${JSON.stringify(value)}`);
}

function renderOrderState(state: OrderState) {
  switch (state.status) {
    case "idle":
      return <div>尚未加载</div>;
    case "loading":
      return <div>加载中...</div>;
    case "success":
      return <div>订单金额：{state.data.amount}</div>;
    case "error":
      return <div>请求失败：{state.error}</div>;
    default:
      return assertNever(state);
  }
}
```

如果在 `OrderState` 新增 `{ status: "cancelled" }` 而未添加 `case`，default 分支中的 `state` 仍为 cancelled 对象，不能赋值给 `never`，触发编译错误。

注意：可辨识联合类型约束单个状态的形状，不能单独保证状态转换的合法性。状态转换可以通过 reducer/状态机约束；请求竞态需用 AbortController、请求序号或其他独立机制解决。

## 第二轮追问：API 返回类型与运行时校验

```ts
type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

interface User {
  id: number;
  name: string;
}

async function getUser(): Promise<ApiResult<User>> {
  const response = await fetch("/api/user");
  const data = await response.json();
  return { success: true, data };
}
```

即使服务器返回 `{ "id": "123", "name": 100 }`，TypeScript 也无法在编译期发现。标准 DOM 类型中 `Response.json()` 返回 `Promise<any>`；泛型和类型断言不执行运行时校验。

推荐将外部数据视为 `unknown`，按需要进行 Zod 校验：

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});
type User = z.infer<typeof UserSchema>;

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getUser(): Promise<ApiResult<User>> {
  try {
    const response = await fetch("/api/user");
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const rawData: unknown = await response.json();
    const result = UserSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: "服务端返回的数据格式不正确" };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "网络请求失败" };
  }
}
```

是否运行时校验应按信任边界、风险和成本决定。若接口契约确实允许数字字符串，可以显式设计转换及校验；不能为了消除报错随意将字段放宽成联合类型。注意 `Number("abc")` 是 `NaN`，`Number("")` 是 0。

## 评分

| 维度 | 得分 |
| --- | ---: |
| 发现不合理状态组合 | 18/20 |
| 联合类型重新建模 | 8/25 |
| 类型收窄与字面量类型 | 16/20 |
| never 穷尽检查 | 15/15 |
| 编译期与运行时校验 | 18/20 |
| **合计** | **75/100** |

主要问题：首次独立设计仍使用多个布尔字段；追问中已理解 never 和编译期/运行时校验。

参考资料：
- [TypeScript Narrowing / Exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- [Zod](https://zod.dev/)
