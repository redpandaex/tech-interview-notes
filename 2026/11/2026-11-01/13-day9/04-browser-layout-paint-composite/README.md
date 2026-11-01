# 第 9 天 · 第 4 题：Layout、Paint、Composite

**评分：85/100**

## 题目

比较修改 width、transform、opacity 可能引发的浏览器渲染阶段，并解释为何动画优先使用 transform、opacity。

## 1. 渲染阶段（45/50）

| 属性 | Layout | Paint | Composite |
|---|---|---|---|
| width | 通常需要 | 通常需要 | 通常需要 |
| transform | 不需要 | 在可合成优化下可跳过 | 通常需要 |
| opacity | 不需要 | 在可合成优化下可跳过 | 通常需要 |

- 修改 width 改变布局几何，可能影响周围元素并触发重新布局和绘制。
- transform 改变视觉位置，不改变正常文档流占位。
- opacity 改变透明度，不改变布局。
- transform 和 opacity **有机会只在合成阶段更新**，但是否能跳过 Paint 取决于具体元素、图层和浏览器优化，不能绝对保证。

## 2. 动画性能（40/50）

- 高频 width/left 修改可能每帧触发布局、绘制；布局计算影响范围可能较大。
- 合成层上的 transform/opacity 动画可避免重复 Layout/Paint，通常性能更好。
- 合成层也消耗显存，不能无条件对所有元素使用 will-change。

## 布局抖动（Layout Thrashing）

布局抖动特指反复交替写入样式和读取布局信息，造成多次强制同步布局：

```js
for (const el of elements) {
  el.style.width = "200px";
  console.log(el.offsetWidth); // 可能触发强制同步布局
}
```

尽量批量读取，再批量写入，减少布局读写交错。

[原始回答](./answer.md)
