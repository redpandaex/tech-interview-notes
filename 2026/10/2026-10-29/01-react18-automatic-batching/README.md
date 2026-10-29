# 第 6 天 · 第 1 题：React 18 自动批处理

**日期：** 2026-10-29  
**评分：** 63/100

## 题目

在 React 18 + createRoot + 生产模式中，点击一次按钮：

```tsx
const [count, setCount] = useState(0);
const [flag, setFlag] = useState(false);
console.log("render", count, flag);

function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setFlag(!flag);
  console.log("click", count, flag);

  setTimeout(() => {
    setCount(prev => prev + 1);
    setFlag(prev => !prev);
    console.log("timeout");
  }, 0);
}
```

1. 最终 count/flag、click 日志和更新渲染次数？
2. 为什么两次 setCount(count + 1) 只加 1？函数式更新有何不同？
3. React 17/18 批处理的差异、性能收益，以及强制同步提交 API？

## 参考答案

### 1. 状态与渲染

- 最终 `count = 2`、`flag = false`。
- 点击回调的日志是 `click 0 false`，不是 `click 1 true`。
- 点击后通常产生两次更新渲染：点击回调批处理后 `1,true`；定时器批处理后 `2,false`。不计初始渲染。

**原因：** 每次 React 函数组件渲染创建自己的 State 快照，旧事件处理函数中的 `count`、`flag` 不会被 setState 修改。即使更新已提交，旧闭包捕获的值仍然不变。

### 2. State 快照、更新队列与批处理的区别

```tsx
setCount(count + 1);
setCount(count + 1);
```

在当前 `count=0` 的闭包中，两次都相当于 `setCount(1)`，队列最终值为 1；这不是“React 把两次加法合并成一次”。

```tsx
setCount(prev => prev + 1);
setCount(prev => prev + 1);
```

队列中的函数依次基于前一个结果计算：0→1→2。

混合更新例子：

```tsx
setCount(count + 1);        // 1
setCount(prev => prev + 1); // 2
setCount(10);               // 10
setCount(prev => prev * 2); // 20
```

- State 快照解释旧值；
- 更新队列解释最终 State；
- 批处理解释减少渲染/提交次数。

### 3. React 17 vs React 18

React 17 默认对 React 事件处理函数中的多次状态更新进行批处理，但 setTimeout、Promise.then、原生 DOM 事件中的更新默认不自动批处理（特殊手段除外）。

React 18 在使用 `createRoot` 时，将自动批处理扩展到 setTimeout、Promise.then、原生事件等场景。它减少不必要的 Render、Reconciliation 和 Commit，但不等于忽略更新队列，也不保证所有异步更新无限期合并。

### 4. useLayoutEffect 与 flushSync

- `useLayoutEffect` 在 DOM 提交后、浏览器绘制前执行，适合测量布局，不是专门的同步强制提交 API。
- `flushSync` 从 `react-dom` 导入，可要求 React 同步刷新更新以便读取更新后的 DOM；可能提前刷新其他待处理更新，有性能代价，应谨慎使用。

```tsx
import { flushSync } from "react-dom";

flushSync(() => {
  setCount(prev => prev + 1);
});
// 此处通常可读取更新后的 DOM
```

## 评分

| 项目 | 得分 |
|---|---:|
| 最终状态、日志、渲染次数 | 27/35 |
| State 快照与函数式更新 | 25/30 |
| React 18 自动批处理 | 11/35 |
| **总分** | **63/100** |

[用户原始回答与评价](./answer.md)
