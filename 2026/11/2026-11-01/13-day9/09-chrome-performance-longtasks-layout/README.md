# 第 9 天 · 第 9 题：Chrome Performance 性能分析

**评分：90/100**

## 题目

React 页面滚动卡顿；Performance 显示超过 100ms 的主线程长任务、频繁 Layout、复杂 DOM。如何定位和优化？

## 1. 定位（45/50）

1. Performance 录制并复现滚动卡顿。
2. 查看 Main 线程长任务，展开调用栈定位耗时函数；通过 Bottom-up、Call tree 查看自身耗时和累计耗时。
3. 结合 Layout 事件与 Forced Reflow（强制同步布局）线索查找触发布局的代码。
4. 区分 JavaScript 执行耗时与浏览器渲染阶段的 Layout 耗时；不能将所有 Layout 直接归因于 JavaScript。

## 2. 优化（45/50）

- 将长同步任务分批执行，并在批次间让出主线程（如适用时使用 scheduler.yield()，注意兼容性）。
- 适合纯计算的任务可放到 Web Worker；Worker 不能直接操作 DOM。
- 布局读取与写入分离，避免写入后立即读取 offsetWidth 等导致重复强制同步布局。

```js
// 容易造成反复布局：
for (const el of elements) {
  el.style.width = "200px";
  console.log(el.offsetWidth);
}

// 集中读取后写入：
const widths = elements.map(el => el.offsetWidth);
elements.forEach(el => {
  el.style.width = "200px";
});
```

- 对大量复杂 DOM：考虑虚拟列表、减少不必要的 React 渲染、简化布局嵌套，必要时使用 CSS contain 限制影响范围。

[原始回答](./answer.md)
