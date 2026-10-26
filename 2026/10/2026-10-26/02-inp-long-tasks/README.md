# 浏览器 INP 与 Long Task 优化

> 日期：2026-10-26 · 第 3 天 · 题号 02 · 方向：浏览器 · 难度：★★★★☆

**状态：待作答**

## 题目背景

React 后台首屏正常，点击“展开全部”需约 800ms，Performance 发现多个 Long Task，页面有大表格与复杂计算。

## 主问题

1. 什么是 INP，与 FCP、LCP、TTI 有何区别？
2. Long Task 为什么产生，和主线程有什么关系？
3. 同步计算 800ms，为什么 Promise.then 不一定解决卡顿？
4. setTimeout、requestAnimationFrame、requestIdleCallback、Web Worker 各适合什么？
5. 你如何定位、优化、验证效果？

## 作答与评审状态

- 用户原始回答：待作答
- 面试官点评：待作答
- 追问记录：待作答（每题最多 1～2 轮）
- 详细标准答案：**暂不公布，待用户作答后补充**

> 后续补充时保留真实回答，详细答案需覆盖原理、执行流程、方案对比、边界、错误示例、最佳实践、可执行代码、权威资料；架构类问题优先附 GitHub Mermaid 图。
