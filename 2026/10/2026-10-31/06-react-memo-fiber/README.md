# 第 7 天 · 第 6 题：React.memo、useMemo、useCallback 与 Fiber

**评分：88/100**

## 题目

1. 父组件每次渲染创建 `user = {name:"Tom"}`，传给 React.memo 子组件，子组件会否重新渲染？如何优化？
2. 函数和对象 Props 每次重新创建；useMemo/useCallback 的作用、等价关系及缓存成本。
3. Fiber、Current/WIP 双树、Render/Commit 区别、是否能自动拆分组件内 200ms 同步计算。

## 参考答案

### React.memo

`React.memo` 默认逐个比较 Props 的属性值，使用 `Object.is`，而不是对整个 Props 对象进行一次引用比较。父组件每次创建新对象会导致对应 Prop 引用变化，子组件通常重新渲染：

```tsx
function Parent() {
  const [count, setCount] = useState(0);
  const user = { name: "Tom" }; // 每次渲染新引用
  return <Child user={user} />;
}
```

可使用 `useMemo(() => ({name:"Tom"}), [])`，或者对真正静态的数据直接移出组件。字符串等基本类型在值相同时可通过比较。memo 不阻止子组件自身 state 或 context 更新引起的渲染。

### useMemo 与 useCallback

- `useMemo(() => calculate(), deps)`：缓存计算结果。
- `useCallback(fn, deps)`：缓存函数引用，基本等价于 `useMemo(() => fn, deps)`。
- 父组件重新执行会创建新的函数和对象，可能使 memo 子组件重新渲染。
- 不应无条件为所有函数和对象加缓存：有依赖比较与维护成本，且可能增加代码复杂度或引入错误依赖。根据实际 Profiler 测量和引用稳定需求选择。

### Fiber

Fiber 是 React 的协调架构，将组件更新工作组织为 Fiber 节点；节点通过 `return`、`child`、`sibling` 等形成树。React 更新通常存在 Current Fiber 树与 Work-In-Progress Fiber 树，通过 alternate 关联并复用工作。

**Fiber 可中断的边界主要是工作单元之间，不能抢占正在执行的普通同步 JavaScript 函数。**

- **Render 阶段**：执行组件、处理状态更新、协调节点、构建 WIP 树、标记变更。并发模式下可能暂停、重做或丢弃部分渲染工作；应保持纯粹。
- **Commit 阶段**：提交 DOM 变更、处理 Ref 和布局 Effect 等。普通 `useEffect` 通常在提交后的被动 Effect 阶段执行，不能笼统认为所有 Hook 都在 Commit 阶段执行。

200ms 同步计算不会被 Fiber 自动拆分。可根据场景使用 useMemo 避免重复计算、Web Worker 转移 CPU 密集计算、业务主动分片。startTransition 可改变更新优先级，但不会自动分割同步函数。

## 复习重点

1. React.memo 默认逐 Prop 使用 Object.is。
2. useMemo/useCallback 是性能优化手段，不是持久化语义保证。
3. Fiber 不是 JS 同步函数的抢占式调度器。
4. Render 计算下一次 UI，Commit 提交结果。

[用户原始回答](./answer.md)
