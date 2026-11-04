# 第 12 天 · 第 6 题：原始回答与追问记录

**最终评分：81/100**

## 主问题：React.memo、useMemo 与 useCallback

**问题：**
1. 输入搜索关键词时，为什么 memo 子组件仍重新渲染？
2. useMemo 与 useCallback 如何优化？
3. keyword 改变时是否应该让列表重新渲染？

### 用户原始回答

> 1. 因为OrderPage更新时,会重新执行函数内部代码,会重新生成一个新的filterOrders以及下面的handleSelect也是,引用地址变了,而memo是通过Object.is来判断是否变化,所以会这样
> 2. useMemo缓存filterOrders的结果,useCallback保存handleSelect函数的应用
> 3. 理论上应该重新渲染吧,这里不是要重新展示订单列表吗

**反馈：** 三问均正确。React.memo 默认对各 Prop 使用 Object.is 浅比较；useMemo 稳定计算结果引用，useCallback 稳定函数引用；业务数据变化时需要正常更新列表。

## 第一次追问：无关 count 状态变化

**问题：**
1. 点击 count 按钮，OrderPage 是否重新执行？
2. orders、keyword 不变时，OrderList 是否重新渲染？
3. 父组件传入内容相同但新创建的 orders 数组，结论是否变化？

### 用户原始回答

> 1. orderPage会把
> 2. 不会吧
> 3. 会,引用地址不同

**反馈：** 第 1 问回答似乎未完成，正确答案是 OrderPage 会重新执行；第 2、3 问正确。若 orders 引用变化，useMemo 依赖失效。

## 第二次追问：旧闭包

**问题：** 如果 useCallback 内读取 keyword，但依赖数组为 []，输入 "react" 后点击订单打印什么？为什么？如何修改依赖？

### 用户原始回答

> 不清楚欸,你能补充一下完整的代码吗?或者你直接告诉我答案也行

**反馈：** 已提供完整可复现代码。空依赖会继续返回首次渲染的回调，其闭包捕获初始 keyword=""，因此打印旧值。修复为 `useCallback(fn, [keyword])`，keyword 变化时回调引用也随之更新。

## 最终评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 25/30 |
| 解决方案 | 34/40 |
| 原理理解 | 15/20 |
| 边界意识 | 7/10 |
| **总分** | **81/100** |

完整解析：[README.md](./README.md)。
