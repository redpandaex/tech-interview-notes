# 第 8 天 · 第 10 题：DOM 事件传播与停止传播

**评分：80/100**

## 题目

parent 注册两个 click 监听器：捕获监听器输出 A，冒泡监听器输出 B；child 注册两个 click 监听器：第一个输出 C 并调用 stopPropagation，第二个输出 D。

## 1. stopPropagation（30/50）

实际输出：

```text
A → C → D
```

先在捕获阶段执行 parent 的 A，再在目标元素 child 执行 C。stopPropagation 阻止事件继续向其他节点传播，但不会阻止同一节点上尚未执行的监听器，所以 D 仍执行。由于停止向父元素冒泡，B 不执行。

用户回答 A-C-D-B，错误在于认为 B 仍会执行。

## 2. stopImmediatePropagation（50/50）

实际输出：

```text
A → C
```

stopImmediatePropagation 同时阻止继续传播与同一元素上后续监听器的执行，故 D、B 均不执行。

| 方法 | 阻止后续节点传播 | 阻止同节点后续监听器 | 取消默认行为 |
|---|---|---|---|
| stopPropagation | 是 | 否 | 否 |
| stopImmediatePropagation | 是 | 是 | 否 |
| preventDefault | 否 | 否 | 对可取消事件是 |

## 后续面试规则

每次一道核心题，通常 1–2 个小问；按回答进行 0–2 次追问；代码题仍可正常出现，但控制规模；每天 10 道，避免重复。

[原始回答](./answer.md)
