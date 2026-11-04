# 第 12 天 · 第 6 题：React.memo、useMemo、useCallback 与闭包陷阱

**方向：React / 性能优化 / JavaScript 闭包**  
**难度：L2**  
**最终评分：81/100**

## 一、原题

一个订单管理页面同时包含搜索框与订单列表：

```tsx
import { useState, memo } from "react";

const OrderList = memo(function OrderList({
  orders,
  onSelect,
}: {
  orders: Order[];
  onSelect: (id: string) => void;
}) {
  console.log("OrderList render");

  return orders.map((order) => (
    <div key={order.id} onClick={() => onSelect(order.id)}>
      {order.name}
    </div>
  ));
});

function OrderPage({ orders }: { orders: Order[] }) {
  const [keyword, setKeyword] = useState("");

  const filteredOrders = orders.filter((order) =>
    order.name.includes(keyword)
  );

  const handleSelect = (id: string) => {
    console.log("选中订单", id);
  };

  return (
    <>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <OrderList
        orders={filteredOrders}
        onSelect={handleSelect}
      />
    </>
  );
}
```

**问题：**

1. 为什么搜索框输入时，即使 `OrderList` 使用了 `React.memo`，仍会重新渲染？
2. 如何使用 `useMemo` 和 `useCallback`，各自解决什么问题？
3. `keyword` 真实变化导致过滤结果变化时，是否应阻止列表渲染？

## 二、React.memo 比较的是什么？

`React.memo` 默认按 Prop 逐项使用 `Object.is` 比较，不做深度比较。

```ts
const a = [{ id: "1" }];
const b = [{ id: "1" }];

Object.is(a, b); // false：内容相同，但引用不同

const fn1 = () => {};
const fn2 = () => {};
Object.is(fn1, fn2); // false：两个不同函数对象
```

函数组件重新执行时：

```tsx
const filteredOrders = orders.filter(/* ... */);
// 每次调用 filter 都产生新数组

const handleSelect = (id: string) => {
  console.log(id);
};
// 每次执行组件函数都创建新函数对象
```

因此，即使业务内容没变，`OrderList` 接收到的 `orders` 和 `onSelect` 引用也可能变化，使 memo 失效。

**重要区分：** 父组件重新渲染不代表 memo 子组件一定会执行；如果所有相关 Prop 保持不变且没有子组件自己的 state/context 更新，React 通常可以跳过子组件重新渲染。React.memo 是性能优化，而不是绝对不渲染的语义承诺。

## 三、useMemo 和 useCallback 的正确用法

```tsx
import { memo, useCallback, useMemo, useState } from "react";

interface Order {
  id: string;
  name: string;
}

const OrderList = memo(function OrderList({
  orders,
  onSelect,
}: {
  orders: Order[];
  onSelect: (id: string) => void;
}) {
  console.log("OrderList render");
  return (
    <div>
      {orders.map((order) => (
        <button key={order.id} onClick={() => onSelect(order.id)}>
          {order.name}
        </button>
      ))}
    </div>
  );
});

export default function OrderPage({ orders }: { orders: Order[] }) {
  const [keyword, setKeyword] = useState("");
  const [count, setCount] = useState(0);

  // 依赖不变时，复用上次过滤结果的引用
  const filteredOrders = useMemo(
    () => orders.filter((order) => order.name.includes(keyword)),
    [orders, keyword]
  );

  // 此版本只使用 id，不读取组件内变化的值，[] 合理
  const handleSelect = useCallback((id: string) => {
    console.log("选中订单", id);
  }, []);

  return (
    <>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <button onClick={() => setCount((c) => c + 1)}>
        count: {count}
      </button>
      <OrderList orders={filteredOrders} onSelect={handleSelect} />
    </>
  );
}
```

| Hook | 缓存对象 | 适用场景 |
|---|---|---|
| `useMemo(calculate, deps)` | 计算结果 | 避免重复计算、稳定数组或对象引用 |
| `useCallback(fn, deps)` | 函数引用 | 稳定传给 memo 子组件的回调，或供其他 Hook 依赖 |
| `React.memo(Component)` | 组件渲染的跳过优化 | Props 不变时尽量避免重新执行子组件 |

可将 `useCallback(fn, deps)` 理解为 `useMemo(() => fn, deps)` 的便捷形式，但不应把它理解成函数结果缓存。

### 三种触发场景

1. **仅 count 变化：** `OrderPage` 会重新执行；`orders`、`keyword` 稳定时，`filteredOrders` 与 `handleSelect` 引用保持稳定，`OrderList` 通常被 memo 跳过。
2. **keyword 变化：** `filteredOrders` 必须重新计算，列表显示可能变化，重新渲染合理。
3. **父组件每次都创建新 orders 数组：** 即使内容相同，`orders` 引用变化也会使 `useMemo` 重新计算，导致列表可能重新渲染。必要时从数据源层面稳定引用或重新评估是否值得 memo。

## 四、核心追问：Stale Closure（闭包捕获旧状态）

错误代码：

```tsx
const [keyword, setKeyword] = useState("");

const handleSelect = useCallback((id: string) => {
  console.log("选中订单", id, keyword);
}, []); // ❌ 缺少 keyword 依赖
```

如果首次渲染 `keyword=""`，之后用户输入 `"react"`，点击订单仍可能输出空字符串。

原因：

```text
第 1 次渲染：
  keyword₁ = ""
  创建函数 F1，闭包捕获 keyword₁
  useCallback(F1, []) 返回 F1

用户输入 "react" → setKeyword("react")

第 2 次渲染：
  keyword₂ = "react"
  创建函数 F2，闭包捕获 keyword₂
  useCallback(F2, []) 因依赖没变，返回缓存的 F1

点击订单：
  执行 F1 → 读取 keyword₁ → ""
```

函数式组件每次渲染都会形成新的词法环境；旧闭包捕获的是当次渲染的状态绑定，不会自动变成最新状态。

### 正确写法

```tsx
const handleSelect = useCallback((id: string) => {
  console.log("选中订单", id, keyword);
}, [keyword]);
```

`keyword` 变化时，新函数会捕获最新的 `keyword`。此时回调引用改变是合理的，因为回调的行为确实依赖关键词。

### 完整可复现代码

```tsx
import { memo, useCallback, useMemo, useState } from "react";

interface Order {
  id: string;
  name: string;
}

const initialOrders: Order[] = [
  { id: "1", name: "react 订单" },
  { id: "2", name: "vue 订单" },
  { id: "3", name: "react 组件订单" },
];

const OrderList = memo(function OrderList({
  orders,
  onSelect,
}: {
  orders: Order[];
  onSelect: (id: string) => void;
}) {
  console.log("OrderList render");
  return (
    <div>
      {orders.map((order) => (
        <button key={order.id} onClick={() => onSelect(order.id)}>
          {order.name}
        </button>
      ))}
    </div>
  );
});

export default function OrderPage() {
  const [keyword, setKeyword] = useState("");
  const [count, setCount] = useState(0);

  const filteredOrders = useMemo(
    () => initialOrders.filter((order) => order.name.includes(keyword)),
    [keyword]
  );

  // ❌ 故意复现旧闭包问题
  const handleSelect = useCallback((id: string) => {
    console.log("选中订单", id, keyword);
  }, []);

  return (
    <div>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜索订单"
      />
      <button onClick={() => setCount((c) => c + 1)}>
        count: {count}
      </button>
      <OrderList orders={filteredOrders} onSelect={handleSelect} />
    </div>
  );
}
```

将最后的 `useCallback` 依赖改为 `[keyword]` 即可修复。

## 五、面试高频延伸

### 1. useCallback 是否让函数内部计算更快？

不会。它主要稳定函数对象引用，不会缓存函数执行结果。函数被调用时仍执行函数体。

### 2. 是否所有函数都要包 useCallback？

不需要。只有在引用稳定性对性能或依赖管理有实际价值时使用；滥用会增加代码复杂度。

### 3. 如何避免闭包捕获旧状态？

- 把所有实际读取的响应式变量放进依赖数组。
- 更新状态时，如果只依赖前一个状态，使用函数式更新 `setCount(c => c + 1)`，减少对外部闭包值的依赖。
- 不要为了保持引用稳定而随意删掉依赖项。
- 可用 ESLint 的 `react-hooks/exhaustive-deps` 检查依赖遗漏。

### 4. React StrictMode 为什么可能看到多次 render 日志？

开发环境的 StrictMode 可能额外执行渲染以发现不纯的代码。判断真实生产性能时应使用 React DevTools Profiler 等工具，不要只依据 console.log 次数。

### 5. useEffectEvent 能替代点击事件的 useCallback 吗？

不应该。Effect Event 是给 Effect 中需要读取最新值、又不想把该逻辑作为 Effect 依赖的场景使用，不是普通 UI 点击事件处理器的通用替代品。

## 六、面试简答模板

> React.memo 默认使用 Object.is 对 Prop 做浅比较。父组件每次渲染执行 filter 都会产生新数组，内联回调也会产生新函数，所以 memo 可能失效。useMemo 可以稳定过滤结果的引用，useCallback 可以稳定回调引用。但 keyword 变化时过滤结果确实改变，列表重新渲染是合理的。useCallback 的依赖必须包含回调中读取的变化状态；如果回调使用 keyword 却写空依赖，旧闭包会一直读取初次渲染的 keyword，产生 stale closure。

## 七、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 25/30 |
| 解决方案 | 34/40 |
| 原理理解 | 15/20 |
| 边界意识 | 7/10 |
| **总分** | **81/100** |

主问题全部答对；第一次追问关于组件是否重新执行和引用变化基本理解正确。最后一次追问用户表示不清楚并主动请求完整代码和答案，因此重点补充闭包捕获与依赖数组。
