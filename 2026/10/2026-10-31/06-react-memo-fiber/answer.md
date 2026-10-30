# 第 7 天 · 第 6 题：用户原始回答与评分

**评分：88/100**

## 用户原始回答（逐字保留）

1. 会的,setCount触发Paretn重新渲染,然后函数重新执行,user重新创建,导致引用地址变了,memo检测到props的变化就重新渲染了
2. 钱比较吧,Object.is
3. 用useMEMO去缓存user
4. 就会让memo不触发更新了,因为字符串比较大话,js中是值类型



1. onClick和config被重新创建了
2. useMemo缓存计算结果,useCallback缓存函数引用
3. 金恩可以
4. 不应该,这样反而可能会导致性能变差



1. ReactFiber是react16以后提出的一个新概念,fiber本质上是一个对象,然后react有两颗fiber树,解决旧版react更新时不可被中断的问题
2. 不是,具体取决于内部的一个优先级以及当前的ui渲染状态
3. render阶段主要是进行一个DFS的深度过程,进行比如说figber树的一个构建,commit阶段主要是操作fiber上一些节点进行dom和hook的操作
4. 应该不能吧,

## 评价

对 memo、对象引用、useMemo/useCallback、Fiber 双树和同步计算不能自动分片的理解良好。需要区分 memo 对每个 prop 的 Object.is 比较、Fiber 工作单元之间让出主线程和无法抢占同步 JS 函数、Render/Commit/Passive Effect 的时机。

[参考答案](./README.md)
