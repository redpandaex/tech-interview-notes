# 第 6 天 · 第 3 题：DOM 事件传播、事件委托与 React 事件系统

评分：62/100

## 题目

outer > inner > button，outer 和 inner 分别注册 click 捕获和冒泡监听器，button 注册 click 监听器。

1. 点击按钮的输出顺序及捕获、目标、冒泡阶段。
2. preventDefault、stopPropagation、stopImmediatePropagation 区别；按钮上调用 stopPropagation 后的输出。
3. 10,000 个按钮如何事件委托，target/currentTarget 区别，React onClick 与原生监听器区别，React 17 以后委托位置。

## 参考答案

### 1. 传播顺序

```text
outer capture
inner capture
button
inner bubble
outer bubble
```

捕获从外层祖先向目标传播；目标阶段在目标元素执行；冒泡从目标向外层祖先传播。目标元素上捕获和非捕获监听器都在目标阶段执行，通常捕获监听器先执行。

### 2. 事件控制 API

- preventDefault：取消可取消事件的默认行为，不阻止传播；被动监听器无法借此取消默认行为。
- stopPropagation：阻止事件继续向其他节点传播，不阻止当前节点其他监听器执行；捕获阶段也适用。
- stopImmediatePropagation：阻止继续传播，并阻止当前节点后续监听器执行。

按钮监听器打印 button 后调用 stopPropagation，输出仅为 outer capture、inner capture、button。

### 3. 事件委托

在父元素上注册一个监听器，利用事件冒泡和 event.target 识别子元素。event.target 是实际触发目标，event.currentTarget 是当前监听器所在元素。

```js
const list = document.querySelector("#list");
list.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-id]");
  if (!button || !list.contains(button)) return;
  console.log(button.dataset.id);
});
```

closest 可处理按钮内嵌 span 等元素的点击。事件委托减少监听器数量、便于动态列表，但不会减少 DOM 节点数。

React onClick 使用合成事件（SyntheticEvent），可通过 nativeEvent 访问底层原生事件。React 16 及之前主要委托到 document；React 17 及之后主要委托到 React 根容器，便于多 React 版本、嵌套应用共存。并非所有事件都采用完全相同的委托机制。

## 补充：Rust Rc/Weak 与 JavaScript WeakMap

Rust Rc/Arc 使用强引用计数，Rc 互相强引用可能形成泄漏，Weak 不增加强引用计数可打破引用环。JS 追踪式 GC 本身可回收不可达循环引用，WeakMap 对对象键的弱引用用途主要是避免缓存阻止键被回收；二者概念相近但内存管理体系不同。

## 评分

| 考察点 | 得分 |
|---|---:|
| 传播顺序与阶段 | 26/30 |
| 三个事件控制 API | 21/30 |
| 事件委托与 React | 15/40 |
| **总分** | **62/100** |

[用户原始回答](./answer.md)
