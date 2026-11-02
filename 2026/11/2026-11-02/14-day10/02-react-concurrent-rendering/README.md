# Day 10 · Q2 — React 18 Concurrent Rendering、Fiber 与 useTransition（90/100）

## 场景

输入框和 10,000 条搜索结果位于同一个 React 函数组件。输入更新应及时响应，过滤与列表渲染相对不紧急。

## 问题

1. `startTransition` 为什么可能让输入更流畅？
2. `startTransition` 能否中断耗时 200ms 的同步 `items.filter()`？
3. `setKeyword` 引起的高优先级重新渲染，会不会也重复执行 `filter()`？如何优化？

## 原理

- `startTransition` 标记其中同步触发的状态更新为非紧急 Transition 更新，使 React 在渲染调度时优先响应更紧急的输入更新。
- Fiber 的可中断渲染依赖 React 在**不同工作单元之间**检查是否应让出主线程。React 无法在用户提供的同步函数内部任意位置抢占执行。
- 函数组件重新渲染会重新执行组件函数体。即使 `query` 不变，直接写在函数体中的 `items.filter(...)` 仍会重新计算。
- `useMemo` 以 `[items, query]` 为依赖缓存过滤结果。输入的 `keyword` 单独变化时，依赖不变可复用结果。
- `useMemo` 不保证列表子树本身不会重新渲染；拆分 `React.memo` 子组件可在 props 稳定时跳过其渲染。对于极大列表可采用虚拟滚动。
- 当确实需要运行 200ms 的同步过滤时，`useMemo` 也不能把这次必要计算变成可中断的。可考虑 Web Worker 将计算移出主线程，或通过索引、分块等算法手段优化。
- `useMemo` 是性能优化提示，不是语义保证；缓存依赖稳定性很重要。如果父组件每次传入新 `items` 数组引用，缓存可能失效。

## 参考代码（含注释）

```tsx
import { memo, useMemo, useState, useTransition } from "react";

// 结果列表单独拆成组件：items 引用不变时可以跳过重新渲染
const SearchList = memo(function SearchList({
  items,
}: {
  items: string[];
}) {
  return (
    <ul>
      {items.map((item, index) => (
        // 示例中假设数据可能重复，生产中优先使用稳定的业务 ID
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
});

export function SearchPage({ items }: { items: string[] }) {
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // 只在 items 或 query 改变时重新过滤
  // keyword 单独改变时，复用过滤结果
  const filteredItems = useMemo(() => {
    return items.filter(item => item.includes(query));
  }, [items, query]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    // 紧急更新：尽快响应用户输入
    setKeyword(value);

    // 非紧急更新：允许 React 延后列表对应的状态更新
    startTransition(() => {
      setQuery(value);
    });
  }

  return (
    <>
      <input value={keyword} onChange={handleChange} />
      {isPending && <span>Updating...</span>}
      <SearchList items={filteredItems} />
    </>
  );
}
```

**代码说明：** 此示例沿用题目给出的字符串数组。真实业务中列表项应有稳定唯一 ID，不建议对会插入、删除、重排的列表使用数组下标作为 key。

## 执行路径

```text
用户输入
  ├─ setKeyword：紧急更新 → SearchPage 重新执行
  │     └─ query/items 未变 → useMemo 复用过滤结果
  │           └─ SearchList 的 items 引用不变 → React.memo 可跳过列表渲染
  └─ startTransition(setQuery)：非紧急更新
        └─ query 改变 → 需要真正过滤数据与更新列表
              ├─ React 可以在 Fiber 工作单元之间让出主线程
              └─ 但无法抢占已经开始的同步 filter()
```

## 评分

**90/100**。正确理解 Transition 的优先级、同步计算不可中断、函数组件重新执行以及 `useMemo` 优化；需进一步区分计算缓存、子树渲染跳过、虚拟列表及真正的主线程卸载。