# 第 12 天 · 第 5 题：TypeScript 可辨识联合类型与 API 响应设计

**方向：TypeScript / 前后端接口契约 / 类型收窄**  
**难度：L2**  
**评分：94/100**

## 一、题目

后端订单接口成功时：

```json
{
  "success": true,
  "data": {
    "orderId": "1001",
    "status": "paid"
  }
}
```

失败时：

```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "订单不存在"
  }
}
```

原来的类型：

```ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

使用：

```ts
function handleResponse(response: ApiResponse<Order>) {
  if (response.success) {
    console.log(response.data.orderId);
    // TypeScript: response.data 可能是 undefined
  }
}
```

问题：为什么检查了 `success` 仍不能直接访问 `data`？如何设计类型，让 TypeScript 自动识别成功与失败分支？

## 二、问题根源：属性之间没有关联

`data?: T` 表示 `data` 可能不存在，`success: boolean` 又没有声明当其为 `true` 时必须存在 `data`。

因此下列数据在原定义下仍然合法：

```ts
const invalidButTypeChecks: ApiResponse<Order> = {
  success: true,
  // 没有 data，仍然满足原类型
};
```

同样，原类型也允许同时提供 `data` 和 `error`，即使业务不希望两者同时存在。

关键问题不是单纯“有 `?`”，而是**类型系统没有获得 `success` 与 `data/error` 的关联规则**。

## 三、解决方案：可辨识联合类型

```ts
interface Order {
  orderId: string;
  status: "paid" | "pending" | "cancelled";
}

interface ApiError {
  code: string;
  message: string;
}

type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ApiError;
    };
```

这里 `success` 是判别字段（discriminant），`true` 和 `false` 是布尔字面量类型，不是泛泛的 `boolean`。

```ts
function handleResponse(response: ApiResponse<Order>) {
  if (response.success) {
    // success === true，自动收窄到成功分支
    console.log(response.data.orderId);
  } else {
    // success === false，自动收窄到失败分支
    console.error(response.error.code);
  }
}
```

这样可从类型层面表达“成功必有 data，失败必有 error”。

### 可选：更严格禁止多余字段

为了明确成功分支不允许携带 `error`，失败分支不允许携带 `data`，可以加上 `never`：

```ts
type StrictApiResponse<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: ApiError; data?: never };
```

注意：`never` 用于增强结构约束，并不能替代运行时校验。

## 四、扩展为三状态：success / error / loading

题目进一步要求三种状态：

- `success`：必须有 `data: T`。
- `error`：必须有 `error`。
- `loading`：没有 `data` 和 `error`。

```ts
type ApiState<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: ApiError }
  | { status: "loading" };
```

使用示例：

```ts
function renderState(state: ApiState<Order>): string {
  switch (state.status) {
    case "success":
      return `订单：${state.data.orderId}`;

    case "error":
      return `错误：${state.error.message}`;

    case "loading":
      return "正在加载";
  }
}
```

`status` 采用字符串字面量联合类型即可，不必使用 `enum`。

**架构提醒：** `loading` 通常是客户端异步请求生命周期状态，而不是服务器单次 HTTP 响应本身的状态。可以分别设计 `ApiResponse<T>`（网络返回）和 `AsyncState<T>`（前端请求状态），避免将两种语义混为一谈：

```ts
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: ApiError };
```

## 五、为什么 `status !== "error"` 还不能访问 data？

错误写法：

```ts
function handleResponse(response: ApiState<Order>) {
  if (response.status !== "error") {
    console.log(response.data.orderId);
  }
}
```

排除 `error` 后，剩下的类型仍是：

```ts
{ status: "success"; data: Order }
| { status: "loading" }
```

`loading` 没有 `data`，因此不能访问。

正确写法：

```ts
function handleResponse(response: ApiState<Order>) {
  if (response.status === "success") {
    console.log(response.data.orderId);
  } else if (response.status === "error") {
    console.error(response.error.message);
  } else {
    console.log("正在加载");
  }
}
```

**类型收窄的原则**：一个条件必须能把联合类型收窄到所有成员都拥有目标属性的集合，才可以安全访问。

## 六、进阶：使用 never 做穷尽检查

在业务状态逐渐增多时，建议让编译器提醒遗漏的状态：

```ts
function assertNever(value: never): never {
  throw new Error(`Unexpected state: ${JSON.stringify(value)}`);
}

function describeState(state: ApiState<Order>): string {
  switch (state.status) {
    case "success":
      return state.data.orderId;
    case "error":
      return state.error.message;
    case "loading":
      return "加载中";
    default:
      return assertNever(state);
  }
}
```

如果未来给 `ApiState<T>` 增加 `{ status: "cancelled" }`，但忘记处理，`assertNever(state)` 处会产生类型错误，从而在编译期发现遗漏。

## 七、生产环境边界：TS 类型不校验真实 JSON

```ts
const response = await fetch("/api/orders/1001");
const payload = await response.json();
```

TypeScript 的类型只在编译期生效，网络数据仍然可能不符合约定。需要严格保障边界时，可在运行时校验返回值（例如使用 schema 校验库，或手写类型守卫）。

不要因为把响应写成 `ApiResponse<Order>` 就认为服务端数据一定合法。

## 八、面试简答模板

> 原类型中 success 只是 boolean，data 又是可选字段，两者没有类型层面的关联，所以判断 success 不能证明 data 一定存在。我会用可辨识联合类型，分别定义 success:true + data:T 和 success:false + error。TypeScript 根据 success 字面量自动收窄。若扩展 loading 状态，则用 status:"success" | "error" | "loading" 三个分支；判断 status !== "error" 时仍可能是 loading，必须明确判断 status === "success" 才能安全访问 data。需要时用 never 检查分支穷尽性。

## 九、评分与改进建议

| 维度 | 得分 |
|---|---:|
| 问题分析 | 29/30 |
| 解决方案 | 37/40 |
| 原理理解 | 19/20 |
| 边界意识 | 9/10 |
| **总分** | **94/100** |

用户独立提出成功/失败的字面量联合类型，并正确指出排除 error 后仍有 loading 分支。建议下一步练习 `never` 穷尽检查、类型守卫与运行时数据校验。
