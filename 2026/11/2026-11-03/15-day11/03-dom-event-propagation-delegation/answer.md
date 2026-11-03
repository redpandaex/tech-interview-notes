# 第 11 天 · 第 3 题：用户原始回答与评分

**最终评分：85/100**

## 题目

1. 点击 child 按钮后，父元素有捕获监听器 A、冒泡监听器 B，child 有调用 `stopPropagation()` 的监听器 C 和另一个监听器 D。问输出顺序，以及 `true`、`stopPropagation()`、`stopImmediatePropagation()` 的含义。
2. 对有 1000 个按钮且动态增删的列表，如何使用事件委托？

## 用户原始回答（原文）

> 1. ABCD,true表示开启捕获,要使用stopImmediatePropagation才能拦截当前元素所有拦截器的冒泡
> 2. 监听列表外面的容器,然后去对比target去查找元素

## 反馈

- **第 1 问：** 正确输出为 `A C D`，不是 `A B C D`。A 在捕获阶段执行，C 和 D 在目标元素上依次执行；C 调用 `stopPropagation()` 后，事件不会再冒泡至 parent，故 B 不执行。
- **概念：** `true` 表示捕获监听器，回答正确。`stopImmediatePropagation()` 不仅阻止传播，还阻止当前元素上尚未执行的监听器；它不只是“拦截冒泡”。
- **第 2 问：** 将监听器绑定在列表容器上，并通过 `event.target` 定位点击目标，思路正确。建议用 `event.target.closest("button")` 处理按钮内部的子元素，再用 `container.contains(button)` 限定范围。

## 最终评分

**85/100**。主要扣分点为事件执行顺序；其余核心概念基本掌握。

详见 [README.md](./README.md)。
