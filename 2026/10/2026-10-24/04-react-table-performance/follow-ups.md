# 第 4 题 · 面试过程

**第一轮用户回答：** 用 React DevTools 火焰图和 Chrome DevTools 分析 React 重渲染与布局；React.memo 缓存整个表格；useMemo 缓存计算、useCallback 缓存函数地址；虚拟列表只渲染可视区与缓冲区。动态行高、固定列、跨行选择方案不清楚。

**点评：** 工具和三个优化 API 的基本方向正确。但 memo 整张表不能有效阻断表内部的行更新，应缩小 memo 粒度到行或单元格。动态行高需实际高度测量和缓存，固定列注意 sticky 与布局同步，跨行选择需持久化选中 ID。

**第二轮追问：** React.memo 包裹行组件却仍全部重渲染，为什么？

**用户回答：** 猜测 id 变化导致父组件和子组件重渲染；建议不在函数中使用 map。

**点评：** id 在题设中未改变，真正变化的是内联函数 `() => handleSelect(row.id)` 的引用。父组件使用稳定的 useCallback，通过函数式 setState 更新 Set，子组件再调用 `onSelect(row.id)`。

**模拟评分：65/100。** 应重点巩固 Props 引用稳定性、memo 浅比较、虚拟滚动边界处理。
