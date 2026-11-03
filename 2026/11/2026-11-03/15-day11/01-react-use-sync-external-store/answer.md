# 第 11 天 · 第 1 题：原始回答与评分

**最终得分：82/100**

## 主问题

考察 React 18 并发渲染中外部 Store 的 Tearing、`useSyncExternalStore` 的职责，以及将 `useEffect + useState` 改造为专用订阅 Hook。

### 用户原始回答

> 1. 不一定,React的更新是可中断具备优先级的
> 2. 因为更新时可能被中断了,这个过程中store也变化了
> 3. 这就是状态撕裂吧,由于可中断更新导致的
>
> 1. 这个subscribe就是一个常见store中返回的订阅,这个subscribe函数返回的也是取消订阅的函数,getSnapshot是一个快照
> 2. 可以,但是要手动同步状态,zustand早期react版本就是这样做的,但是不能适配中断更新和批量更新
> 3. 改成使用useSyncStorage

### 主问题评价

- React 并发渲染可以中断和恢复：正确。
- 外部 Store 可能在渲染期间更新，造成 Tearing：正确。
- `subscribe` 与 `getSnapshot` 的基本职责：基本正确。
- `useEffect + useState` 可做普通订阅，但并发一致性需要专门机制：方向正确。
- 未给出 `useSyncExternalStore` 的具体代码；Hook 名称拼写有误。

## 针对性追问

比较：

版本 A：

```tsx
useSyncExternalStore(
  (listener) => store.subscribe(listener),
  () => store.getState().count
);
```

版本 B：

```tsx
useSyncExternalStore(
  (listener) => store.subscribe(listener),
  () => ({ ...store.getState() })
);
```

问题：哪个版本有问题？Store 未更新时，`getSnapshot` 是否必须返回相同对象引用？

### 用户原始回答

> 1. B吧,每次都会创建一个新对象
> 2. 不需要吧

### 追问评价

- **第 1 问正确**：版本 B 每次创建新对象，`Object.is` 比较不相等。
- **第 2 问错误**：Store 未更新时，`getSnapshot` 必须返回稳定快照；若返回对象，通常必须保持相同引用，否则 React 可能重复渲染并警告。
- 额外细节：版本 A 中内联 `subscribe` 函数每次渲染会产生新引用，可能造成不必要的重新订阅；可将其移出组件。

## 最终评分

**82/100**。

完整参考答案、示例与解释见 [README.md](./README.md)。
