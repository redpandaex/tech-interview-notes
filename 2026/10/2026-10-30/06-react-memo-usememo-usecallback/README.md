# 第 6 天 · 第 6 题：React.memo、useMemo 与 useCallback

**评分：75/100**

## 题目

```tsx
const Child = memo(function Child({user,onClick}) {
  console.log("Child render");
  return <button onClick={onClick}>{user.name}</button>;
});
function Parent() {
  const [count,setCount] = useState(0);
  const user = {name:"Tom"};
  const handleClick = () => console.log("Hello");
  return <>
    <button onClick={() => setCount(count + 1)}>增加 count</button>
    <Child user={user} onClick={handleClick}/>
  </>;
}
```

1. Parent/Child 是否重新渲染？React.memo 如何比较 Props？
2. 如何使用 useMemo/useCallback 优化？二者有何关系？
3. memo 后自身 useState、useContext 变化、仅父组件重新渲染时，Child 是否重新渲染？

## 参考答案

**Parent 会重新渲染**，因为自己的 count State 更新。**Child 也会重新渲染**，因为每次 Parent 执行都会新建 user 对象和 handleClick 函数，导致 Props 引用变化。React.memo 默认逐项使用 Object.is 比较新旧 Props 的值，不会递归深比较。

完整优化：

```tsx
const user = useMemo(() => ({name:"Tom"}), []);
const handleClick = useCallback(() => console.log("Hello"), []);
<Child user={user} onClick={handleClick}/>;
```

其中 useMemo 缓存计算结果（这里是对象引用），useCallback 缓存函数引用。行为上：

```tsx
useCallback(fn, deps)
useMemo(() => fn, deps)
```

二者等价。此例 user 不依赖组件内部状态，也可以移到组件外部，避免无必要的 Hook。

memo 不能阻止 Child 自身 useState 更新导致的重新渲染，也不能阻止 Child 订阅的 Context 值变化引发的更新。若仅 Parent 更新，Child Props 完全不变且无其他更新来源，React 通常跳过 Child 的重新渲染。memo 是性能优化而非绝对保证。

需要区分 Render（组件函数重新执行）与 Commit（将变化提交到 DOM）；Render 不意味着所有 DOM 节点重建。

## 评分

| 考察点 | 得分 |
|---|---:|
| React.memo 比较机制 | 24/35 |
| useMemo、useCallback 优化 | 21/35 |
| React.memo 局限性 | 30/30 |
| **总分** | **75/100** |

[用户原始回答及评价](./answer.md)
