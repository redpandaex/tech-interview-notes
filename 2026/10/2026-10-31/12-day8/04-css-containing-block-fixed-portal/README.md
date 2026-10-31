# 第 8 天第 4 题：CSS 包含块、fixed、层叠上下文与 Portal

**评分：76/100**。与上次同类题 48 分相比提高 28 分。

## 1. absolute 包含块

```css
.outer { position: relative; width: 400px; height: 300px; }
.middle { width: 200px; height: 100px; }
.inner { position: absolute; top: 20px; left: 30px; }
```

1. inner 相对于 outer 建立的绝对定位包含块计算 top/left（通常以 padding box 为基准）。
2. middle 默认 position:static，未建立绝对定位包含块；需要寻找最近的、能够建立该包含块的祖先，而不只是检查直接父元素。
3. middle 添加 transform:translateX(0) 后，即使位移为零，也建立绝对定位包含块，inner 改为相对 middle 定位。
4. 删除 outer 的 position:relative，且无其他建立包含块的祖先时，inner 使用**初始包含块**，通常与视口尺寸相关，不等同于 body。

## 2. fixed 与 transform

```css
.container { transform: translateZ(0); }
.modal { position: fixed; top: 0; left: 0; }
```

transform 的计算值非 none 时可为 fixed 后代建立包含块，即使实际变换位移为零；modal 因此不一定相对视口定位。transform 也创建层叠上下文，但**层叠上下文和定位包含块是不同机制**。例如 opacity:0.9 可创建层叠上下文，却通常不建立 fixed 包含块。仅给 container 设置 position:relative 不会改变 fixed 相对于视口的定位参考系。Modal/Tooltip 常需要覆盖或定位到整个视口，因此受影响。

## 3. overflow、z-index 与 Portal

```css
.card { position: relative; overflow: hidden; width: 200px; height: 100px; }
.menu { position: absolute; top: 80px; left: 0; height: 150px; z-index: 9999; }
```

菜单超出 card 裁剪区域的部分会被隐藏。z-index 控制层叠顺序，不会突破 overflow:hidden 的裁剪区域。使用 React createPortal 将菜单挂到 document.body，菜单不再是 card 的 DOM 后代，可摆脱 card 对后代的裁剪；但仍可能受到 Portal 目标及其他祖先的样式约束。Portal 保持 React 逻辑组件树，Context 传递不变，React 事件也按 React 树传播。

getBoundingClientRect 给出相对视口的坐标，菜单若用 position:fixed（且无特殊包含块），直接设置：

```ts
const rect = button.getBoundingClientRect();
const style = {
  position: "fixed",
  top: rect.bottom, // 140
  left: rect.left,   // 200
  minWidth: rect.width // 120
};
```

不应为普通 fixed 定位再加 scrollY；文档坐标系下的 absolute 定位通常需考虑滚动偏移。

## 4. 评分

| 项目 | 得分 |
|---|---:|
| absolute 包含块 | 13/15 |
| 初始包含块 | 4/10 |
| transform 与 fixed | 15/20 |
| 层叠上下文与包含块区分 | 5/10 |
| overflow 与 z-index | 10/15 |
| Portal 与 Context | 15/15 |
| 浮层坐标 | 14/15 |
| **总分** | **76/100** |

[原始回答](./answer.md)
