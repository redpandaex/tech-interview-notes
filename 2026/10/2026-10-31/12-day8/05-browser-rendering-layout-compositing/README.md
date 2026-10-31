# 第 8 天第 5 题：浏览器渲染机制、重排重绘、合成与布局抖动

**评分：58/100**

## 一、DOM、CSSOM、Render Tree

DOM 是 HTML 解析后得到的节点对象模型，包含元素、文本等节点。CSSOM 是 CSS 规则和样式表的对象模型，不是与 DOM 同构的选择器树。浏览器结合 DOM、CSSOM 完成样式计算，构建用于布局和绘制的内部结构（Render Tree 是简化模型）。

- display:none：不生成普通布局盒，不参与布局，也不绘制。
- visibility:hidden：通常仍参与布局、占据空间，但自身内容不可见。
- opacity:0：通常仍参与布局。

Layout 计算几何尺寸、位置、文本换行；Paint 生成绘制信息（文字、背景、边框等）；Rasterization 把绘制内容转换为像素；Composite 根据图层位置、变换、透明度等将图层组合为最终画面。现代浏览器实际流水线比这些概念更复杂。

JavaScript 不总需要等待 CSSOM 完成：位于同步脚本之前、会阻塞脚本的样式表可能使脚本等待；后续尚未遇到的样式表不会反向阻塞前面的脚本。async/defer 主要影响外部脚本下载和执行时机，不是 CSSOM 开关。

## 二、Layout、Paint 与 Composite

```js
box.style.width = "200px"; // A
box.style.backgroundColor = "blue"; // B
box.style.transform = "translateX(100px)"; // C
box.style.opacity = "0.5"; // D
```

- A：通常 Layout + Paint，之后可能 Composite。
- B：通常不需要 Layout，需要 Paint，之后可能 Composite。
- C、D：通常不需要 Layout，在合适的图层与渲染条件下可能主要由 Composite 处理；但不保证永不发生 Paint 或重新光栅化。

transform/opacity 通常不改变正常布局占位，适合动画；在满足合成器优化条件时还可能减少主线程工作。合成层是浏览器用于独立处理、光栅化或合成内容的内部结构，不等同于 CSS 层叠上下文（Stacking Context）。

will-change:transform 提示浏览器即将变更 transform，浏览器可能预先优化或分配图层，但不保证独立合成层。大量使用会增加内存、图层管理、光栅化与合成开销。

## 三、强制同步布局与 Layout Thrashing

```js
const items = document.querySelectorAll(".item");
items.forEach((item) => {
  const width = item.offsetWidth;
  item.style.width = `${width + 10}px`;
});
```

问题在于交替读布局信息（offsetWidth）和写布局属性（style.width）。浏览器可能尚未完成前一次样式变更，而下一次 offsetWidth 要求最新几何信息，于是强制同步布局。Layout Thrashing 是反复读写导致多次不必要的同步布局计算，**不是**元素尺寸短时间大幅变化。

优化：集中读取，再集中写入。

```js
const items = document.querySelectorAll(".item");
const widths = Array.from(items, (item) => item.offsetWidth);
items.forEach((item, index) => {
  item.style.width = `${widths[index] + 10}px`;
});
```

第一次读取仍可能触发一次同步布局，但减少后续反复强制布局。requestAnimationFrame 只改变执行时机，不会自动修复回调中的读写交替。

## 四、评分

| 项目 | 得分 |
|---|---:|
| DOM、CSSOM | 8/10 |
| Render Tree | 4/10 |
| Layout、Paint | 9/10 |
| Rasterization、Composite | 2/10 |
| CSS 与 JS 执行 | 5/10 |
| 渲染阶段判断 | 7/15 |
| 合成层与 will-change | 2/10 |
| 强制布局与抖动 | 9/10 |
| 读写分离与 rAF | 12/15 |
| **总分** | **58/100** |

[原始回答](./answer.md)
