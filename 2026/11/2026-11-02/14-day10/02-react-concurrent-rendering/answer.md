# Day 10 · Q2 — 原始回答与追问

## 初次回答

用户回答：

> 1. 有可能可以，startTransition 的作用是把优先级不那么高的 UI 渲染放到低优先级，对于这个有一定的帮助。
> 2. 不能。
> 3. 不能中断，React Fiber 的 scheduler 明确只能中断 React 任务，不能够中断用户的代码。

**评价：** 方向正确。更精确的描述是：React 可在 Fiber 工作单元之间让出执行权，但无法中断正在执行的同步 JavaScript 函数（例如一次耗时 200ms 的 `filter()`）。

## 追问

问题：`setKeyword` 的高优先级更新会重新执行 `SearchPage`，即使 `query` 未变化，也会重新执行 `items.filter()` 吗？如何优化？

用户回答：

> 会，因为渲染以后会重新执行这个函数式组件，可以使用 userMemo 包裹起来？

**评价：正确。** API 名称应为 `useMemo`。缓存 `[items, query]` 对应的过滤结果，避免仅 `keyword` 变化时重复计算。进一步可使用 `React.memo` 拆分列表组件，减少不必要的 JSX 构造与子树渲染；实际 200ms 同步计算仍需考虑算法优化或 Web Worker。

## 评分

**90/100**。参考答案与注释代码见 [README.md](./README.md)。