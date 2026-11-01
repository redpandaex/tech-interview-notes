# 第 9 天 · 第 3 题：React.memo 与 props 引用稳定性

**评分：100/100**

## 题目

```tsx
function Parent() {
  const [count, setCount] = useState(0);
  const config = { theme: "dark" };
  return <><button onClick={() => setCount(count + 1)}>{count}</button><Child config={config} /></>;
}
const Child = React.memo(function Child({ config }) {
  console.log("Child render");
  return <div>{config.theme}</div>;
});
```

## 1. Child 是否重新渲染？（50/50）

会。Parent 更新时函数组件重新执行，重新创建 config 对象。React.memo 默认使用 Object.is 对每个 prop 进行浅比较；即使内容相同，新旧 config 的引用不同，Object.is(prevConfig,nextConfig) 为 false，因此无法跳过 Child 渲染。

```js
Object.is({}, {}); // false
Object.is("dark", "dark"); // true
```

## 2. 优化方式（50/50）

1. `const config = useMemo(() => ({ theme: "dark" }), []);`，复用对象引用。
2. 直接传基本类型 `<Child theme="dark" />`，简化 props。
3. 对完全静态的配置，也可定义在组件外部，无需 useMemo。

注意：React.memo 只是优化，子组件自身 state 更新或订阅的 Context 变化仍可能触发渲染。是否使用 memo 需要结合实际性能分析。

[原始回答](./answer.md)
