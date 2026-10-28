# 第 5 天 · 第 8 题：CSS 层叠上下文与 z-index

日期：2026-10-28
评分：75/100

## 题目

```html
<div class="container"><div class="modal">弹窗</div></div>
<div class="header">导航栏</div>
```

```css
.container { position: relative; z-index: 1; }
.modal { position: fixed; z-index: 9999; inset: 0; background: rgba(0,0,0,.5); }
.header { position: relative; z-index: 10; height: 60px; background: white; }
```

1. 为什么 modal 的 z-index 9999 仍被 header 的 10 遮挡？
2. 什么是 Stacking Context？哪些 CSS 属性会创建它？
3. React 中如何实现不受普通父容器层叠上下文限制的全局 Modal？

## 参考答案

### 1. 层叠上下文的嵌套比较

`.container {position:relative; z-index:1}` 创建层叠上下文；`.header {position:relative; z-index:10}` 创建另一个。它们在根层叠上下文中比较：header(10) 在 container(1) 之上。modal 的 z-index:9999 仅在 container 内部发挥作用，不能跨过父级层叠上下文压过 header。仅设置 position:relative、z-index:auto 通常不创建新的层叠上下文。

### 2. 定义与常见触发条件

层叠上下文是浏览器组织元素前后绘制顺序的独立分组机制，不是普通文档流、Flex 或 Grid 布局。

常见创建条件：

- 根元素 html；
- position:relative 或 absolute，且 z-index 非 auto；
- position:fixed 或 sticky；
- opacity 小于 1；
- transform 非 none；
- filter 非 none；
- isolation:isolate；
- Flex/Grid 子项 z-index 非 auto。

display:flex 本身不创建层叠上下文；visibility:visible 也不创建。不同层叠上下文中的子元素 z-index 不能简单跨组比较。

### 3. React Portal

```tsx
import { createPortal } from "react-dom";

function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>,
    document.body
  );
}
```

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,.5);
}
.modal-content { background: white; padding: 24px; }
```

Portal 将 DOM 节点挂载在 body 下，避免被原本普通容器的层叠上下文困住；但 React 逻辑树不变，Context 和 React 事件传播仍按 React 树运行。Portal 不保证绝对置顶，浏览器 Top Layer 或其他更高层级元素仍可能遮挡。实际弹窗还需处理焦点、ESC、滚动锁定、无障碍等。

## 评分

| 考察点 | 得分 |
|---|---:|
| z-index 遮挡原因 | 30/35 |
| 层叠上下文概念与创建条件 | 15/35 |
| Portal 方案 | 30/30 |
| **总分** | **75/100** |

原始回答与点评见 [answer.md](./answer.md)。
