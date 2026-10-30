# 第 6 天 · 第 8 题：浏览器渲染、重排重绘与强制同步布局

评分：62/100

## 题目

解释 DOM、CSSOM、Render Tree、Layout、Paint、Composite；分别分析修改 width、backgroundColor、transform 的影响；解释 offsetWidth 引发的强制同步布局与优化方式。

## 参考答案

### 渲染流水线

HTML 解析形成 DOM，CSS 解析形成 CSSOM，浏览器结合 DOM 与样式信息进行样式计算，生成用于布局和绘制的结构（常用简化模型称 Render Tree），再执行 Layout（计算几何尺寸与位置）、Paint（生成绘制指令）和 Composite（合成各层结果）。现代浏览器实现更复杂，不能机械理解为固定且完整的一条线。

display:none 的元素不生成布局盒；visibility:hidden 通常仍参与布局。伪元素也可能生成布局盒。

### 三种 CSS 修改

- width：通常需要 Layout，随后可能 Paint、Composite。
- background-color：通常不需要 Layout，但需要 Paint。
- transform：通常不改变正常文档流中的布局空间；在合成优化条件满足时，可能跳过 Layout 和 Paint，只进行 Composite。不能保证始终只合成。

相较于改变 left，transform 通常更适合位移动画，因为 left 是布局相关属性，transform 更容易利用合成优化。但过多合成层可能增加 GPU 内存消耗。

### 强制同步布局

```js
box.style.width = "300px";
console.log(box.offsetWidth);
box.style.height = "400px";
```

浏览器可以批量处理样式修改，但在布局信息过期后读取 offsetWidth 可能迫使它立即执行样式与布局计算以返回最新几何值，即 Forced Synchronous Layout。循环中反复读写可能导致 Layout Thrashing（布局抖动），产生大量重复布局工作。

优化方法：集中读取布局数据，再集中写入样式；避免循环内读写交替；对动画优先考虑 transform/opacity；requestAnimationFrame 可协调绘制时机，但不会自动消除强制布局。

```js
const boxes = [...document.querySelectorAll(".box")];
const widths = boxes.map(box => box.offsetWidth);
boxes.forEach((box, i) => {
  box.style.width = `${widths[i] + 10}px`;
});
```

getComputedStyle 是读取计算样式的 API，不是样式修改 API；它也可能触发样式计算，某些情况下读取特定属性会触发布局，不能视为通用性能优化方法。

## 评分

- 渲染流水线：22/35
- 重排、重绘与合成：30/35
- 强制同步布局与优化：10/30
- **总分：62/100**

[用户原始回答](./answer.md)
