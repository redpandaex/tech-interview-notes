# 第 14 天 · 第 2 题：Reflow、Repaint、强制同步布局与合成层

**方向：浏览器渲染 / 性能优化 / React 动画**  
**难度：L1–L2**  
**评分：87/100**

## 题目

```js
const box = document.querySelector(".box");

box.style.width = "200px";
console.log(box.offsetWidth);
box.style.height = "300px";
console.log(box.offsetHeight);
```

1. Reflow（重排）和 Repaint（重绘）是什么？
2. 为什么读取 offsetWidth/offsetHeight 可能触发 Forced Synchronous Layout？
3. 如何优化批量修改 1000 个 DOM 元素的样式？

## 一、浏览器渲染流水线

常见简化模型：

```text
JavaScript → Style → Layout → Paint → Composite
```

- **Style**：计算元素匹配的 CSS 规则及最终样式。
- **Layout（Reflow）**：计算元素的位置、尺寸等几何信息。
- **Paint（Repaint）**：生成绘制内容，如背景、边框、文本等。
- **Composite**：合成不同图层，形成最终画面。

这只是简化模型，浏览器实际实现更复杂；并非每次样式变化都会完整经历所有阶段。

| 修改 | 常见影响 | 说明 |
|---|---|---|
| width / height | Layout + 后续阶段 | 可能影响自身及相关元素的几何尺寸 |
| color / background-color | Paint + Composite | 通常不需要重新计算布局 |
| transform / opacity | 可能仅 Composite | 在符合合成条件时可以跳过布局与绘制 |

**重排通常伴随后续绘制或合成工作；重绘不一定需要重排。**

## 二、强制同步布局（Forced Synchronous Layout）

浏览器可能延迟、合并多次样式修改，而不是每修改一次立即计算布局。

```js
box.style.width = "200px";
box.style.height = "300px";
box.style.margin = "20px";
```

如果在布局失效后，立即读取需要最新几何数据的属性：

```js
box.style.width = "200px";
console.log(box.offsetWidth);
```

浏览器可能必须同步执行样式和布局计算，才能返回准确尺寸。

常见布局读取包括：
- `offsetWidth` / `offsetHeight`
- `clientWidth` / `clientHeight`
- `scrollWidth` / `scrollHeight`
- `getBoundingClientRect()`

**边界：**不是所有读取都会触发布局。是否需要同步布局取决于样式/布局是否失效、读取的数据是否依赖最新布局、浏览器实现等。

## 三、Layout Thrashing（布局抖动）

不推荐：

```js
const elements = document.querySelectorAll(".item");

elements.forEach((el) => {
  el.style.width = `${container.offsetWidth}px`;
});
```

如果修改 item 的宽度影响 container 的布局，下一次读取 container.offsetWidth 就可能迫使浏览器同步布局。循环中反复读写交错，可能产生布局抖动。

推荐：

```js
const width = container.offsetWidth; // 先读

elements.forEach((el) => {
  el.style.width = `${width}px`; // 后写
});
```

进一步优化：
- 若所有元素宽度相同，优先通过 CSS 规则、类名或 CSS 变量统一控制，减少逐元素 JS 写入。
- 如果需要测量不同元素，先集中读取所有尺寸，再集中写入。
- 对批量创建节点可使用 DocumentFragment 减少逐次插入文档的开销；但 DocumentFragment 不意味着所有场景一定减少布局次数。
- 大数据列表使用虚拟列表，只创建可视区域附近的 DOM，减少布局、绘制和节点管理成本。

## 四、transform 与 left 动画

```css
/* 方案 A：修改布局相关属性 */
.sidebar {
  position: absolute;
  left: -300px;
  transition: left 300ms;
}
.sidebar.open {
  left: 0;
}

/* 方案 B：变换 */
.sidebar {
  transform: translateX(-100%);
  transition: transform 300ms;
}
.sidebar.open {
  transform: translateX(0);
}
```

通常推荐 B：
- left 变化可能引起布局计算和重绘。
- transform 通常不需要重新布局。
- 若元素满足合成条件，transform 动画可能直接在合成阶段完成，减轻主线程的布局/绘制压力。

**边界：**
- transform 不保证一定建立独立合成层，也不保证永远不触发绘制。
- left:-300px 与 translateX(-100%) 不完全等价：前者是固定 300px，后者的百分比通常相对于元素自身参考盒尺寸。
- 需要考虑动画是否影响周围元素的正常布局、定位方式与交互。

## 五、will-change 的作用和代价

```css
.sidebar {
  will-change: transform;
}
```

`will-change` 是向浏览器提供即将变化的属性提示。浏览器可以据此提前优化，但不是强制保证。

不推荐：

```css
.item {
  will-change: transform;
}
```

如果页面有 1000 个 item，浏览器可能创建或准备过多合成层，增加图形内存、图层管理和合成开销，反而降低性能。

实践建议：
1. 先通过性能分析工具确认瓶颈，避免无依据地添加 will-change。
2. 仅对少数确实需要高频动画的元素使用。
3. 尽量在动画前短暂启用，动画结束后视情况移除。
4. 避免为大量静态元素长期保留 will-change。

## 六、性能排查

在 Chrome DevTools Performance 面板中：
- 查看长任务、帧率和 Main 线程耗时。
- 关注 Layout、Recalculate Style、Paint 等活动。
- 留意 Forced reflow/Forced layout 相关警告与调用栈。
- 检查动画是否大量触发布局或绘制，以及是否出现过多合成层。

## 七、面试回答模板

> Reflow 是重新计算元素的几何布局，Repaint 是重新绘制外观。浏览器会尽量合并 DOM 样式更新；如果写入导致布局失效后立即读取 offsetWidth 等几何属性，就可能发生强制同步布局。反复交错读写会造成 Layout Thrashing，应采用先读后写、减少 DOM 数量、批量更新和虚拟列表等方式优化。动画优先考虑 transform/opacity，因为符合条件时可以走合成阶段；但合成层有内存和管理成本，will-change 只能有针对性地使用。

## 八、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 28/30 |
| 解决方案 | 35/40 |
| 原理理解 | 17/20 |
| 边界意识 | 7/10 |
| **总分** | **87/100** |

详见 [answer.md](./answer.md)（原始回答与追问记录）。
