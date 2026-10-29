# 第 6 天 · 第 6 题：用户原始回答与评分

**评分：75/100**

## 用户原始回答（逐字保留）

1. 不会
2. 会,因为handleClick没有被缓存
3. Object.is吧
4. 使用useCallback吧
5. useMmeo是缓存计算结果
6. useCallback缓存函数引用
7. 不知道,没看懂这两个有啥关系
8. 12都有可能,3应该不会

## 评价

- **24/35**：Parent 自身 count State 更新会重新渲染；Child 不仅因 handleClick 新函数，还因 user 新对象重新渲染；React.memo 默认逐项 Object.is 比较 Props。
- **21/35**：useMemo 缓存计算结果，useCallback 缓存函数引用；完整优化需同时稳定 user 与 handleClick；useCallback(fn,deps) 行为上等价 useMemo(()=>fn,deps)。
- **30/30**：正确判断自身 State 和 Context 更新仍可能使 memo 组件重新渲染；只有父组件更新且 Props 不变时通常可跳过。

[完整参考答案](./README.md)
