# 第 5 天 · 第 1 题：原始回答与评价

**评分：80/100**

## 用户原始回答（逐字保留）

> 1. 会,因为增加会导致这个父组件渲染,但是子组件的memo没有指定依赖,所以还是会导致重新渲染
> 2. 可以用useCallback把handleClik函数和setCount函数包裹起来,他用于缓存函数的引用地址
> 3. memo解决重渲染,useMemo缓存计算结果,useCallback缓存函数避免地址偏移,不是,反而有可能损坏性能

## 评价

1. **20/30**：知道 Child 会重新渲染，但原因不是 memo 未指定依赖；而是 Parent 重渲染时创建新的 handleClick，onClick Prop 引用变化，memo 默认 Object.is 比较失败。
2. **25/30**：知道 useCallback 稳定函数引用，但 setCount 本身引用稳定，不需要额外包裹。原生 button 的内联回调也非本题核心。
3. **35/40**：准确区分 memo/useMemo/useCallback 的主要用途，也意识到过度缓存可能有性能开销。

完整代码及参考答案见 [README.md](./README.md)。
