# Day 10 · Q4 — 强制同步布局、布局抖动与 requestAnimationFrame（90/100）

## 面试题

页面有 1000 个消息元素：

```js
const items = document.querySelectorAll(".message-item");

items.forEach(item => {
  const height = item.offsetHeight;
  item.style.height = `${height + 10}px`;
});
```

问题：为什么可能导致性能问题？如何保证每个元素最终高度为原高度 +10px？把 DOM 写操作放入 `requestAnimationFrame` 能否消除重排？

## 参考答案

### 1. 为什么出现 Layout Thrashing

`offsetHeight` 是布局相关的读取。修改 `style.height` 可能使布局信息失效。下一次读取另一个元素的 `offsetHeight` 时，浏览器为提供最新值，**可能不得不立即同步计算布局**，而不是等待正常的渲染阶段批量处理。

```text
读取 A 高度 → 修改 A 高度（布局可能失效）
  → 读取 B 高度（可能强制同步布局）
  → 修改 B 高度（再次失效）
  → 读取 C 高度（可能再次强制同步布局）……
```

注意：读取 `offsetHeight` 并非每次都触发强制布局；前提是存在需要更新的布局信息。布局更新范围还与 DOM 结构、CSS 和浏览器优化有关。

### 2. 优化：读写分离

```js
const items = document.querySelectorAll(".message-item");

// Read：先集中读取所有元素的原始高度。
// 如果之前有未完成的布局更新，首次读取可能触发一次同步布局。
const heights = Array.from(items, item => item.offsetHeight);

// Write：再集中修改高度，避免在写入之间插入布局读取。
// 按原始高度 + 10px 设置，满足题目功能要求。
items.forEach((item, index) => {
  item.style.height = `${heights[index] + 10}px`;
});
```

这里避免的是反复交错读写造成的**重复同步布局**，而不是彻底不做布局。

### 3. requestAnimationFrame 能否消除重排？

**不能。** `requestAnimationFrame` 让回调在浏览器下一次绘制前执行，便于安排视觉更新，但修改 `height` 仍可能需要重新计算布局。

```js
requestAnimationFrame(() => {
  item.style.height = "200px"; // 修改布局属性

  // 紧接着读取布局属性，仍可能触发强制同步布局
  console.log(item.offsetHeight);
});
```

不要把 `requestAnimationFrame` 等同于“无重排”。若需求只涉及视觉位移/缩放，可评估 `transform`，但它不会改变元素真实布局尺寸，不能直接替代本题的高度调整。

## 术语辨析

- **Layout/Reflow**：浏览器计算元素几何信息，是页面渲染中的正常工作。
- **Forced Synchronous Layout**：脚本读取布局信息时，浏览器被迫提前同步计算最新布局。
- **Layout Thrashing**：脚本反复交替进行布局读写，导致频繁强制同步布局，形成明显性能开销。
- **requestAnimationFrame**：将回调安排在下一次绘制前执行，调整时机而非消除布局。

## 评分

**90/100**：准确识别布局抖动、提出读写分离、理解 requestAnimationFrame 不消除重排；需要补充触发布局的条件和三种概念的边界。