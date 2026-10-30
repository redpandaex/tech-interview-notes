# 第 7 天 · 第 2 题：React 状态快照、闭包与 useRef

**评分：82/100**

## 题目

1. 连续调用三次 setCount(count + 1)，console.log(count) 输出多少，UI 最终显示多少？如何增加 3？
2. setCount(1) 后，在 setTimeout 中打印旧 count，为什么？如何读取最新状态？
3. 修改 ref.current 是否触发渲染？useRef 为何保持稳定对象？useState 和 useRef 在 Fiber 内部的存储与调度机制有什么区别？

## 参考答案

### 1. 状态快照与函数式更新

```tsx
const [count, setCount] = useState(0);
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);
console.log(count); // 0
// UI 最终为 1
```

同一次渲染中的 count 是固定快照，三个更新都计算出 1。React 处理更新队列时最终状态为 1。改成三个函数式更新可使结果变成 3：

```tsx
setCount(prev => prev + 1);
setCount(prev => prev + 1);
setCount(prev => prev + 1);
```

函数式更新也不会修改当前闭包中的 count，因此紧接着打印仍是 0。

### 2. 陈旧闭包

```tsx
const handleClick = () => {
  setCount(1);
  setTimeout(() => console.log(count), 3000);
};
```

初始 count 为 0 时，定时器回调捕获旧渲染中的 count，三秒后输出 0。若需要长期回调读取最新已提交状态，可使用 ref，并通过 Effect 同步：

```tsx
const countRef = useRef(count);
useEffect(() => { countRef.current = count; }, [count]);
setTimeout(() => console.log(countRef.current), 3000);
```

Ref 保存稳定对象，闭包读取 current 属性，而不是旧状态快照。对于基于最新状态更新，应优先使用函数式 setState。

### 3. useState 与 useRef

两者都通过 Fiber 关联的 Hook 数据结构保存信息。useState 的 Hook 保存 memoizedState、更新队列等信息；setState 会提交更新并调度后续渲染。useRef 的 Hook.memoizedState 保存稳定的 {current: ...} 对象，修改 current 只是普通 JS 属性修改，不会主动触发 React 更新。Ref 不是全局对象，而是属于对应组件实例。

适用场景：DOM 引用、定时器 ID、第三方实例、异步回调需要读取的最新值。参与 UI 展示并要求变化后更新界面的数据应使用 state。

## 评分

**82/100**。函数式更新、状态快照、Ref 使用场景掌握较好。注意同步打印为 0；Ref 不触发更新不是因为引用地址没变；useState 与 useRef 都由 Fiber Hook 保存。

[原始回答](./answer.md)
