# 第 5 天 · 第 1 题：React.memo、useMemo、useCallback

**日期：** 2026-10-28
**评分：80/100**

## 题目

```tsx
import { useState, memo } from "react";

const Child = memo(function Child({
  onClick,
}: {
  onClick: () => void;
}) {
  console.log("Child render");
  return <button onClick={onClick}>点击</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    console.log("clicked");
  };
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <Child onClick={handleClick} />
    </div>
  );
}
```

问题：
1. 点击“增加”后 Child 是否重新渲染？为什么已经使用 React.memo？
2. 如何用 useCallback 优化？原理是什么？
3. React.memo、useMemo、useCallback 各自用途？越多越好吗？

## 参考答案

### 1. React.memo 不是依赖数组

点击增加后 Parent 重新渲染，重新创建 `handleClick` 函数；新旧 `onClick` 引用不同。React.memo 默认逐项使用 `Object.is` 比较 Props，发现 onClick 变化，因此 Child 重新渲染。React.memo 不需要依赖数组，也不能阻止 Child 自己的 State 或 Context 更新导致的渲染。

```ts
const fn1 = () => {};
const fn2 = () => {};
Object.is(fn1, fn2); // false
```

### 2. useCallback 稳定函数引用

```tsx
import { useCallback, memo, useState } from "react";

const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  console.log("Child render");
  return <button onClick={onClick}>点击</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <Child onClick={handleClick} />
    </div>
  );
}
```

依赖不变时，useCallback 返回上次缓存的函数引用，React.memo 就能跳过 Child 的不必要渲染。函数表达式本身仍可能在 Parent 执行时创建，但 React 返回缓存的引用。`setCount` 是 React 保证稳定的 setter，无须额外 useCallback；原生 button 的内联事件处理函数不必为了本题机械优化。

### 3. 三者区别

| API | 缓存什么 | 目的 |
|---|---|---|
| React.memo | 组件渲染结果 | Props 不变时跳过不必要的渲染 |
| useMemo | 计算结果 | 依赖不变时避免重复计算 |
| useCallback | 函数引用 | 稳定传递的回调或依赖 |

```tsx
const filtered = useMemo(() => list.filter(item => item.active), [list]);
const handleClick = useCallback(() => console.log("clicked"), []);
```

缓存和依赖比较都有开销，依赖经常变化或组件渲染很轻时不一定有收益。React Compiler 在启用时可以自动处理部分缓存优化，但仍需要理解语义。

## 评分

| 维度 | 得分 |
|---|---:|
| React.memo 失效原因 | 20/30 |
| useCallback 用法与原理 | 25/30 |
| 三种 API 对比及优化取舍 | 35/40 |
| **合计** | **80/100** |

主要误区：React.memo 没有“未指定依赖”的问题；setCount 自身稳定，无需包裹。原始回答见 [answer.md](./answer.md)。
