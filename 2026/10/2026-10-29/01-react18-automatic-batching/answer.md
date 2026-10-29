# 第 6 天 · 第 1 题：用户原始回答与评分

**评分：63/100**

## 用户原始回答（逐字保留）

1. count最终是2
2. flag最终为false
3. &#x20;1,true
4. 两次

因为react的setState是批处理的,count不会在执行了setState以后就立马执行,而是会进入到updateImpl里面,然后进行批量处理

改成函数式会连续加

1. 不知道
2. 不知道,微任务应该是等到react更新以后再执行的
3. 避免频繁的更新
4. useLayoutEffect?

## 评价

- **27/35：** count=2、flag=false、通常两次更新渲染正确；点击事件内日志应为 `click 0 false`，因为当前闭包中的 State 是快照。
- **25/30：** 知道函数式更新可以累加；需区分“快照导致两次都提交目标值 1”和“批处理减少渲染次数”。
- **11/35：** 知道批处理降低渲染频率，但未掌握 React 18 createRoot 扩展到 setTimeout、Promise.then、原生事件，以及 `flushSync`。 `useLayoutEffect` 不等同于同步提交 API。

[完整参考答案](./README.md)
