# 第 5 天 · 第 5 题：React Hooks 与闭包陷阱

日期：2026-10-28
评分：35/100

## 题目

```tsx
import { useEffect, useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count);
      setCount(count + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <div>{count}</div>;
}
```

1. 页面运行 5 秒后 count 的值与控制台输出？
2. 为什么出现该现象？与 JS 闭包的关系？
3. 如何让 count 每秒递增，且避免每次更新都重建定时器？

## 参考答案

### 1. 运行结果

页面上的 count 在第一次计时后变成 1，之后保持 1。控制台每次计时输出 0（运行约五秒通常输出五次，次数可能受计时调度影响）。

### 2. 闭包与 React 渲染快照

JavaScript 闭包使函数能够访问其定义时所在的词法环境。React 函数组件每次渲染都会重新执行组件函数，产生新的局部变量与闭包。

首次渲染时 count 为 0，useEffect 的定时器回调捕获首次渲染的 count。依赖数组 [] 意味着后续 count 更新不会重建此定时器。第一秒调用 setCount(0 + 1)，页面变成 1；第二秒原定时器依然读取旧 count=0，再次调用 setCount(1)，页面保持 1。这叫 Stale Closure（陈旧闭包）。

注意闭包并非简单复制变量值：普通 JS 闭包可以持续修改同一个 let 变量。此处问题在于 React 不同渲染有不同的 count 绑定，而旧定时器引用旧绑定。

### 3. 推荐修改：函数式更新

```tsx
import { useEffect, useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <div>{count}</div>;
}
```

`prev` 由 React 在处理 State 更新时提供，不依赖定时器闭包中的旧 count。Effect 依赖仍是 []，不必每次重新创建定时器。

另一种写法是在依赖中加入 count：

```tsx
useEffect(() => {
  const timer = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(timer);
}, [count]);
```

这种方式能递增，但每次 count 变化都会 cleanup 并重建定时器，不符合题目额外要求。

### 常见误区

函数式更新适用于基于前一个 State 计算下一个 State；如果异步回调还需要读取最新 State 做其他操作，仍须单独处理陈旧闭包问题。

## 评分

用户答对页面值为 1，但误认为控制台输出 1；第 2 问明确表示忘记原理，第 3 问未作答。综合评分 **35/100**。

用户原始回答见 [answer.md](./answer.md)。
