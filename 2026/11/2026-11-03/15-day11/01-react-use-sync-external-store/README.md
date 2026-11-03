# 第 11 天 · 第 1 题：React useSyncExternalStore 与状态撕裂

**评分：82/100**

## 题目

React 18 管理后台使用外部 Store，通过 `useEffect + useState` 订阅全局状态。并发渲染时，不同组件可能短暂显示不同版本的值。

问题：
1. 为什么并发渲染会使外部 Store 的状态不一致更容易出现？什么是 Tearing？
2. `useSyncExternalStore(subscribe, getSnapshot)` 如何处理外部 Store？为什么不能直接等同于 `useEffect + useState`？
3. 比较返回数字快照和每次返回新对象的快照，解释快照缓存要求。

## 一、Tearing 的本质

React 并发渲染可以在工作尚未完成时暂停、恢复或放弃某次渲染。外部 Store 不受 React 渲染调度直接控制，可能在渲染期间同步改变。

```text
时间  事件                          Store
T1    开始渲染组件 A                 count = 9
T2    A 读取 9
T3    React 暂停渲染
T4    外部 Store 更新                count = 10
T5    React 恢复，组件 B 读取 10
T6    如果没有一致性保护就提交       A:9 / B:10
```

同一次提交中，多个组件观察到不一致的外部状态版本，这种现象称为 **Tearing（状态撕裂）**。

注意：并发渲染可中断不代表每次都会撕裂；关键是外部状态变化与渲染读取之间缺乏一致性协调。

## 二、useSyncExternalStore 的两个参数

```tsx
const snapshot = useSyncExternalStore(subscribe, getSnapshot);
```

- **subscribe**：接收 React 提供的 `onStoreChange` 回调，向外部 Store 注册订阅，并返回取消订阅函数。
- **getSnapshot**：返回外部 Store 当前的**稳定快照**。React 根据快照变化决定是否需要更新，并在必要时重新检查，以避免提交不一致的外部状态。

简化 Store：

```ts
type Listener = () => void;

class Store {
  private state = { count: 0 };
  private listeners = new Set<Listener>();

  getState() {
    return this.state;
  }

  setState(count: number) {
    // 用新对象表示新的状态版本
    this.state = { count };

    // 通知所有订阅者
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

const store = new Store();
```

## 三、正确的 React 组件写法

```tsx
import { useSyncExternalStore } from "react";

// 在组件外定义，保持订阅函数引用稳定
const subscribe = (listener: () => void) => {
  return store.subscribe(listener);
};

// 返回基本类型，未变化时 Object.is 比较结果稳定
const getCountSnapshot = () => {
  return store.getState().count;
};

function CounterA() {
  const count = useSyncExternalStore(
    subscribe,
    getCountSnapshot
  );

  return <div>A: {count}</div>;
}
```

### 为什么不直接使用 useEffect + useState？

```tsx
function CounterA() {
  const [count, setCount] = useState(store.getState().count);

  useEffect(() => {
    return store.subscribe(() => {
      setCount(store.getState().count);
    });
  }, []);

  return <div>A: {count}</div>;
}
```

这一写法可以实现普通订阅，但需要自行处理：
1. **订阅空窗期**：渲染读取状态与 effect 安装订阅之间可能发生更新，若不补读就可能遗漏。
2. **并发一致性**：组件局部 `setState` 不等于 React 已获得外部 Store 的一致性快照契约。
3. **卸载清理**：必须正确取消订阅，避免无效回调。

`useSyncExternalStore` 提供专门的订阅及快照一致性机制；它不是单纯为“批量更新”设计的。

## 四、为什么 getSnapshot 必须稳定？

### 版本 A：正确

```tsx
const count = useSyncExternalStore(
  subscribe,
  () => store.getState().count
);
```

返回数字。若 `count` 未变，两次快照满足 `Object.is(a, b) === true`。

### 版本 B：错误

```tsx
const state = useSyncExternalStore(
  subscribe,
  () => ({ ...store.getState() })
);
```

每次展开对象都会创建新的引用：

```js
const a = { count: 1 };
const b = { count: 1 };

console.log(Object.is(a, b)); // false
```

即使 Store 没有变化，React 仍可能认为快照不同，触发重复渲染甚至无限更新警告：

> The result of getSnapshot should be cached to avoid an infinite loop.

**约束**：Store 没有变化时，`getSnapshot` 应返回 `Object.is` 相等的快照。若快照是对象，通常意味着返回同一对象引用。Store 变化时，应返回能反映新状态的快照。

对于本题的不可变 Store，可以直接返回其当前状态对象：

```tsx
const getStateSnapshot = () => store.getState();
```

因为 `getState()` 在两次更新之间返回同一对象，而 `setState` 创建新对象。

如果底层 Store 原地修改可变对象，则应由 Store 或适配层维护并缓存不可变快照，不能直接把不断变化的同一对象作为快照。

## 五、补充：subscribe 函数引用

下面的代码虽然能够订阅，但每次组件渲染都创建新的 `subscribe` 函数：

```tsx
useSyncExternalStore(
  (listener) => store.subscribe(listener),
  () => store.getState().count
);
```

React 可能因此重新订阅。将 `subscribe` 提取到组件外或使用稳定引用可避免无谓的订阅重建。这与 `getSnapshot` 的稳定性是两个不同问题。

## 六、面试速记

- Tearing：同次 UI 提交读取到外部 Store 的不同版本。
- `subscribe`：注册通知，返回取消订阅函数。
- `getSnapshot`：返回可比较的稳定快照。
- **未更新 → `Object.is` 相等；更新 → 能反映新状态。**
- 不要在 `getSnapshot` 中无条件创建新对象。
- `useEffect + useState` 可以订阅，但不能直接替代 React 的外部状态一致性机制。

## 评分依据

**82/100**。准确理解可中断渲染与 Tearing，能够描述订阅和快照的职责，并识别无条件创建新对象的问题；但未写出完整 Hook 改造代码，对快照稳定性约束回答错误。
