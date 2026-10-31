# 第 8 天 · 第 6 题：React 状态快照、Effect 与自动批处理

**评分：76/100**

## 一、状态快照与闭包

```tsx
const [count,setCount] = useState(0);
const handleClick = () => {
  setCount(count + 1);
  setCount(count + 1);
  console.log("A:",count);
  setTimeout(() => console.log("B:",count),1000);
};
```

点击一次后 A:0、B:0，按钮显示 1。原因不是 setState 是 Promise，也不是 commit 阶段批处理，而是每次渲染的状态值是独立快照：两次 setCount(count+1) 都提交数值 1，闭包仍捕获本轮渲染中的 count=0。更新入队、React 在 Render 阶段计算结果、Commit 阶段提交 DOM。

函数式更新：

```tsx
setCount(prev => prev + 1);
setCount(prev => prev + 1);
```

React 依次将前一更新计算的结果传给后一 updater，因此最终为 2；当前闭包里的 count 不会同步改变。

## 二、Effect 依赖与 useEffectEvent

```tsx
useEffect(() => {
  const connection = createConnection(roomId);
  connection.on("connected", () => showNotification("Connected!",theme));
  connection.connect();
  return () => connection.disconnect();
},[roomId,theme]);
```

theme 改变触发重新渲染，依赖比较发现变化，React 清理上一轮 Effect，再运行新 Effect。**重新渲染不等于组件卸载**。直接从依赖中删掉 theme 会造成事件回调捕获旧 theme 的陈旧闭包。

React 19 推荐将不需要触发重新连接、但需要读取最新 theme 的逻辑移入 Effect Event：

```tsx
const onConnected = useEffectEvent(() => {
  showNotification("Connected!",theme);
});
useEffect(() => {
  const connection = createConnection(roomId);
  connection.on("connected",() => onConnected());
  connection.connect();
  return () => connection.disconnect();
},[roomId]);
```

roomId 是连接生命周期的响应式依赖；theme 只影响通知样式，不应触发连接重新同步。useEffectEvent 可在调用时读取最新 props/state，其函数不应列入 Effect 依赖数组，也不能作为普通事件处理函数或跨组件传递。useCallback 主要缓存函数引用，常用于 memo 子组件、Hook 依赖；useEffectEvent 用于 Effect 的非响应式逻辑，两者不能互换。

## 三、React 18 自动批处理

React 18 createRoot 下 setTimeout 中连续 setA 和 setB 通常自动批处理为一次重新渲染；React 17 典型旧根节点行为下，定时器内更新通常分开触发两次重新渲染（不考虑开发环境 Strict Mode 等差异）。

setState 是提交更新请求，并非 Promise；批处理是多个更新可以在一次渲染中计算，不等于 setState 一定异步执行。

```tsx
import { flushSync } from "react-dom";
flushSync(() => setVisible(true));
// 必要的 DOM 更新在返回前已经提交，可供同步读取
document.querySelector(".panel")?.scrollIntoView();
```

flushSync 用于第三方 API 等确实需要当前同步调用返回前 DOM 更新的特殊场景，可能降低性能，不应常规使用。

## 评分

| 考察项 | 得分 |
|---|---:|
| 状态快照与输出 | 15/15 |
| 批处理与函数式更新 | 10/15 |
| Effect 清理与依赖 | 8/15 |
| 陈旧闭包 | 5/10 |
| useEffectEvent 使用 | 12/15 |
| 与 useCallback 区别 | 6/10 |
| React 18/17 自动批处理 | 10/10 |
| flushSync | 10/10 |
| **总分** | **76/100** |

[用户原始回答](./answer.md)
