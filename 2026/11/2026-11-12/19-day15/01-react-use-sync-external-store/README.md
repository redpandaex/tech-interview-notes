# React useSyncExternalStore：外部 Store、一致性与订阅优化

> 第 15 天 · 第 1 题｜L2–L3｜得分 72/100

## 题目背景

WebSocket 持续更新外部 Store，多个 React 组件订阅数据。如何保证并发渲染一致性、避免订阅空窗期，并降低无关更新带来的渲染开销？

## 一、为什么 useEffect + useState 有风险

```jsx
function Counter() {
  const [count, setCount] = useState(store.getSnapshot().count);
  useEffect(() => store.subscribe(() => {
    setCount(store.getSnapshot().count);
  }), []);
  return <div>{count}</div>;
}
```

- **订阅空窗期**：初始渲染读取快照后，直到 effect 订阅建立前，Store 可能已更新；若没有再次核对快照，更新通知会丢失。
- **状态撕裂（Tearing）**：并发渲染过程中外部数据变化，若不同组件读取不同版本并一同提交，可能出现 UI 不一致。
- effect 中手写订阅也需要处理卸载清理、快照变化检测、服务端渲染等细节。

## 二、useSyncExternalStore 的三个参数

```ts
const snapshot = useSyncExternalStore(
  subscribe,
  getSnapshot,
  getServerSnapshot // SSR 时使用；纯客户端可省略
);
```

| 参数 | 职责 | 约束 |
|---|---|---|
| subscribe | 注册变化回调并返回取消订阅函数 | 尽量保持函数引用稳定 |
| getSnapshot | 返回当前外部状态快照 | 状态未变化时必须返回同一个值/引用 |
| getServerSnapshot | 服务端渲染和客户端 hydration 时的初始快照 | 服务端与 hydration 初始值应保持一致 |

React 会核对外部 Store 快照，防止并发渲染提交过期快照。若在非阻塞 Transition 更新期间发现外部 Store 快照改变，React 可以退回阻塞式更新以保证屏幕一致性。**这不是 React 自动批处理的目的。**

## 三、getSnapshot 的引用稳定性

错误：

```js
const getSnapshot = () => ({ count: store.state.count });
// 每次都创建新对象，即使数据未变，Object.is 也返回 false。
```

正确：

```js
const getSnapshot = () => store.state;
// 只在实际数据变化时替换 state 的引用
store.state = { ...store.state, count: 1 };
```

- 每次返回新对象可能导致无限更新及 React 的快照缓存警告。
- 原地修改同一对象又可能使 React 认为没有变化，因此推荐不可变更新。
- 若外部数据源本身可变，需要缓存上次快照，只有实际数据变化才创建新快照。

## 四、完整实现

```jsx
import { useSyncExternalStore } from "react";

let state = { count: 0, username: "Alice" };
const listeners = new Set();

const store = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  update(patch) {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  },
};

function Counter() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return <div>{state.count}</div>;
}
```

这里将函数定义为不依赖 `this` 的方法，避免作为回调传递时丢失 `this`。若需要 SSR，必须补充正确的 `getServerSnapshot` 并处理服务端/客户端初始数据一致性。

## 五、共享 Store 不等于共享订阅

两个组件分别调用 `useSyncExternalStore`，通常会建立两份订阅；React 不会因为它们使用同一 Store 就自动把订阅合并为一个。Store 更新时可能通知每个 listener。

需要区分：

1. **订阅回调数**：100 个订阅者可能有 100 次通知。
2. **组件 Render 次数**：如果所有组件依赖的快照都变了，100 个组件都可能重新渲染。
3. **Commit 次数**：React 可以批处理更新，减少提交次数，但不等于省略所有 Render。

## 六、Selector 解决无关更新

```jsx
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

function Username() {
  const username = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    undefined, // 无 SSR；SSR 应提供正确的 getServerSnapshot
    state => state.username
  );
  return <div>{username}</div>;
}
```

若 `count` 从 0 变成 1，而 `username` 仍是 `"Alice"`：

- 直接订阅整个 state 的组件：由于新 state 引用变化，可能都重新渲染。
- Selector 订阅 count：选中值变化，更新。
- Selector 订阅 username：选中值不变，跳过由该 Store 更新触发的重渲染。

Selector 不阻止父组件更新或本地状态变化带来的渲染。选中对象时也应关注比较函数和引用稳定性。

## 七、常见面试陷阱

- **误区**：“批量更新造成状态撕裂。”——不准确；问题是并发渲染与外部可变状态的时序一致性。
- **误区**：“共享 Store 就会合并订阅。”——不成立。
- **误区**：“批处理后 100 个组件只 Render 一次。”——混淆了 Render 与 Commit。
- **误区**：“getSnapshot 每次返回新对象更安全。”——违反快照稳定性要求。
- **误区**：“Selector 让组件绝不重渲染。”——只能避免所选外部值不变时的相关更新。

## 八、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 23/30 |
| 解决方案 | 28/40 |
| 原理理解 | 14/20 |
| 边界意识 | 7/10 |
| **总分** | **72/100** |

主要需要巩固：外部 Store 与并发渲染的一致性、订阅数与 Render/Commit 的区别、Selector 优化边界。
