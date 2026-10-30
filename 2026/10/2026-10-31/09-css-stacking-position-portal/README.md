# 第 7 天 · 第 9 题：CSS 层叠上下文、包含块与 React Portal

**评分：48/100**

## 1. 层叠上下文

当 parent-a 为 position:relative;z-index:1、parent-b 为 position:relative;z-index:2 时，即使 child-a z-index:9999、child-b z-index:1，**B 仍显示在 A 上方**，因为子元素先被包含在各自父级层叠上下文中，父级整体按 z-index 排序。

常见创建层叠上下文的条件：根元素、position:fixed/sticky、position:absolute/relative 且 z-index 非 auto、opacity 小于 1、transform 非 none、filter 非 none、isolation:isolate，以及带非 auto z-index 的 Flex/Grid 项目等。

transform:translateZ(0) 即使没有位移，也因 transform 非 none 而创建层叠上下文，还可能为后代建立定位包含块。

## 2. 包含块与定位

**Containing Block（包含块）**是用于计算定位和某些尺寸的参考矩形。absolute 常以最近的能够建立绝对定位包含块的祖先为参考，常见如 position:relative/absolute/fixed/sticky 的祖先，也可能是 transform 祖先；不一定是直接父元素。

fixed 通常相对视口定位，但 transform 等祖先可能为 fixed 建立包含块；单纯 position:relative 不会让 fixed 相对于该祖先。

sticky 参与正常布局，到达滚动约束位置后粘附，并受滚动容器与包含块约束；fixed 通常脱离正常文档流。祖先 overflow:hidden 可能建立 sticky 依赖的滚动容器，即使祖先没有实际滚动，从而导致 sticky 表现不符合预期。overflow:clip 的滚动容器行为与 hidden 不同。

## 3. 裁剪与 Portal

z-index 决定层叠顺序，overflow:hidden 决定溢出裁剪，不能靠增大 z-index 消除实际发生的裁剪。注意 absolute 是否被某个祖先裁剪也取决于包含块结构，并非任意 overflow:hidden 祖先都会裁剪它。

不能修改容器 overflow 时，可将浮层渲染到不受该容器裁剪的 DOM 容器：

```tsx
import { createPortal } from "react-dom";

function Dropdown() {
  return <div className="card">
    <button>打开菜单</button>
    {createPortal(<div className="menu">菜单内容</div>, document.body)}
  </div>;
}
```

Portal 改变 DOM 挂载位置，**不改变 React 组件树中的逻辑父子关系**；Context 和 React 事件冒泡仍按 React 树工作。

## 4. 浮层定位

通过按钮的 getBoundingClientRect() 获取相对于视口的 top/left/bottom/width，配合 Portal 到 body 和 position:fixed 设置菜单位置：

```ts
const rect = button.getBoundingClientRect();
const style = {
  position: "fixed" as const,
  top: rect.bottom,
  left: rect.left,
  minWidth: rect.width
};
```

滚动、窗口尺寸变化、按钮尺寸变化时需要重新定位；还应处理视口边缘碰撞与翻转。实际项目可使用 Floating UI 等成熟定位方案。

## 评分

层叠上下文 16/25；创建条件 5/10；包含块与定位 6/25；sticky 与 overflow 7/15；裁剪与 Portal 10/15；浮层定位 4/10。**合计 48/100**。

[用户原始回答](./answer.md)
