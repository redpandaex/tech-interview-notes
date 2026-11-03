# 第 11 天 · 第 6 题：CSS 层叠上下文与 z-index

**得分：60/100**

## 题目

弹窗的 `z-index: 9999` 仍被导航栏遮挡，解释原因并提出修复方案。

```html
<style>
  .header {
    position: relative;
    z-index: 10;
    background: skyblue;
  }

  .container {
    position: relative;
    z-index: 1;
  }

  .modal {
    position: fixed;
    z-index: 9999;
    background: white;
  }
</style>

<header class="header">导航栏</header>
<div class="container">
  <div class="modal">弹窗</div>
</div>
```

## 一、正确答案

```text
根层叠上下文
├── header       position: relative; z-index: 10
└── container    position: relative; z-index: 1
    └── modal    position: fixed; z-index: 9999
```

`header` 与 `container` 都因定位元素设置了非 `auto` 的 `z-index` 而形成独立层叠上下文。浏览器在根层叠上下文中先比较两个兄弟上下文：`header(10) > container(1)`。

`modal` 的 `9999` 只影响它所在上下文内部的层叠关系。**整个 `container` 作为一个原子单元参与外部排序**，子元素不能仅靠更大的 `z-index` 穿透父级上下文。

即使 `modal` 使用 `position: fixed`，也不意味着它能逃离父级层叠上下文。需要注意：某些祖先属性（如 `transform`、`filter` 等）还可能改变 fixed 元素的包含块。

## 二、修复方案

### 方案 1：使用 Portal（弹窗组件常用）

React 示例：

```tsx
import { createPortal } from "react-dom";

function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="modal">{children}</div>,
    document.body,
  );
}
```

将弹窗 DOM 挂到更高层级的节点（如 `body`），使其不再是 `.container` 的后代，从而不受该父级层叠上下文的限制。仍需确保 Portal 目标及其祖先的层叠关系正确。

**注意：**React Portal 只改变 DOM 放置位置，不改变 React 组件树的逻辑关系；React 合成事件仍可按 React 树传播。

### 方案 2：调整父级层叠上下文的 z-index

```css
.container {
  position: relative;
  z-index: 11; /* 高于 header 的 10 */
}
```

该方案会让整个 `container` 排在 `header` 之上，而不只是弹窗；可能影响其他元素，需按业务需求评估。

### 方案 3：移除不必要的层叠上下文

```css
.container {
  position: relative;
  z-index: auto;
}
```

若没有其他创建层叠上下文的属性，移除 `.container` 的独立上下文可以让弹窗参与更外层的排序。实际效果取决于完整 DOM/CSS 结构。

### 进阶方案：Top Layer

原生 `<dialog>` 的 `showModal()` 会将对话框放入浏览器的 **top layer**，它不依赖普通 `z-index` 竞争，适用于模态对话框。Popover API 也有相应 top-layer 行为，但需要根据组件交互需求选型。

## 三、为什么 overflow: hidden 不是解决办法？

```css
.container {
  overflow: hidden;
}
```

`overflow: hidden` 用于裁剪溢出内容，**不会让子元素超越外部层叠上下文**。某些布局条件下反而会造成弹窗被裁剪。它和 `z-index` 解决的问题不同。

## 四、哪些属性可能创建层叠上下文？

常见情形包括：

- 根元素。
- `position: relative/absolute` 且 `z-index` 不是 `auto`。
- `position: fixed/sticky`。
- `opacity < 1`。
- 非 `none` 的 `transform`、`filter` 等属性。
- `isolation: isolate`。
- 一些 `contain` 值及其他现代 CSS 特性。

注意：`z-index` 的生效条件与是否创建层叠上下文不能完全混为一谈，Flex/Grid 子项等有特殊规则。

## 五、排查步骤

1. 在浏览器开发者工具中检查弹窗及其祖先的 computed styles。
2. 找出每一级创建层叠上下文的祖先，判断弹窗被哪一级“封住”。
3. 对比该祖先与遮挡元素在共同祖先层叠上下文中的层级。
4. 优先从弹窗挂载位置或父级上下文入手修复，而不是盲目把弹窗的 `z-index` 提高到极大数值。
5. 检查 `overflow` 裁剪、`transform` 影响 fixed 包含块等可能并存的问题。

## 六、评分

**60/100**。第一问抓住了 `modal` 受 `container` 层叠上下文限制的核心；第二问使用 `overflow: hidden` 不正确。应掌握 Portal、调整父级层叠上下文和移除不必要上下文等方案。
