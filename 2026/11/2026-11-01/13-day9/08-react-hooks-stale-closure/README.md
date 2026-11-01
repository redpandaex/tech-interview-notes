# 第 9 天 · 第 8 题：React Hooks 与闭包陷阱

**评分：30/100**

## 题目

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return <div>{count}</div>;
}
```

为何只增加到 1？如何修复？

## 1. 根本原因（15/50）

依赖数组为 `[]` 的 Effect 不会因 count 普通更新而重新执行；定时器回调捕获了首次渲染中的 `count = 0`，每次执行都调用 `setCount(1)`。组件函数重新执行不等于旧的 Effect 定时器回调被替换。

## 2. 推荐修复（15/50）

使用函数式更新，避免读取闭包中的旧 count：

```tsx
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

React 在处理状态更新时传入前一个状态值，定时器不必捕获 count。

也可以让 Effect 依赖 count，变化时清理并重建定时器，但会反复重置定时器。使用 useRef 保存最新 count 也能解决，但需要正确同步 ref；单纯 useCallback 缓存函数并不能自动消除旧闭包。

## 核心区分

- 组件重新渲染：函数组件重新执行。
- Effect 重新执行：由依赖及 Effect 生命周期决定。
- 闭包：旧回调引用创建时那次渲染的变量。

[原始回答](./answer.md)
