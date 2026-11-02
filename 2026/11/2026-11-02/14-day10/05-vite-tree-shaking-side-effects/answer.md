# Day 10 · Q5 — 用户回答与追问

## 原始题目

分析 `utils.ts` 中未使用的 `multiply()`、`debug()`，`analytics.ts` 中顶层 `console.log` 的保留行为，以及 `package.json` 中 `sideEffects: false` 的意义。

## 用户原始回答

> 1. 1可以，2有副作用，打包工具不一定会剔除，可能需要先加一个去除console的工具
> 2. 会，这个代表有副作用，影响了外面
> 3. 这个标识各个模块都没有副作用，如果没被引用或者导出就可以删除掉

**评价**：
- `multiply()` 可以删除：正确。
- `debug()` 也可以删除：初次回答不准确；日志位于未调用的函数体内，函数定义本身无副作用。
- `analytics.ts` 顶层日志在保守分析下保留：正确。
- `sideEffects: false` 的模块级副作用含义：基本正确，需注意工具差异。

## 追问

组件库的 `button.ts` 导入 `./button.css` 并导出 `Button`；若包声明 `sideEffects: false`，为什么可能出现按钮正常、样式丢失？如何配置？

用户回答：

> 这个css文件可能会被打包工具识别为没有使用,直接扔掉
> ,sideEffect:["/xxxx/xxx.css"]

**评价**：原理正确。配置字段应为 `sideEffects`（复数），推荐 `["**/*.css"]`，或使用与发布包路径对应的具体 CSS 文件路径。

## 最终评分

**88/100**。完整参考答案与注意事项见 [README.md](./README.md)。