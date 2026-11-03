# 第 11 天 · 第 3 题：DOM 事件传播与事件委托

**评分：85/100**

## 题目

用户点击 `<button>`，判断输出顺序，解释捕获、`stopPropagation` 与 `stopImmediatePropagation`，并说明如何为动态增删的 1000 个按钮使用事件委托。

```html
<div id="parent">
  <button id="child">点击我</button>
</div>

<script>
  const parent = document.querySelector("#parent");
  const child = document.querySelector("#child");

  parent.addEventListener("click", () => {
    console.log("A");
  }, true);

  parent.addEventListener("click", () => {
    console.log("B");
  });

  child.addEventListener("click", (e) => {
    console.log("C");
    e.stopPropagation();
  });

  child.addEventListener("click", () => {
    console.log("D");
  });
</script>
```

## 一、正确输出：A C D

```text
捕获阶段：parent → A
目标阶段：child → C → D
冒泡阶段：parent → B（被阻止，不执行）
```

- `addEventListener(type, listener, true)` 等价于 `{ capture: true }`，监听器在捕获阶段执行；如果监听器位于事件目标上，则会在目标阶段执行。
- `stopPropagation()` 阻止事件继续沿传播路径传播，但不会阻止当前元素上尚未执行的其他监听器。
- 因此 `C` 调用 `stopPropagation()` 后，`D` 仍执行；事件不再向 parent 冒泡，`B` 不执行。

### stopPropagation 和 stopImmediatePropagation 的区别

| 方法 | 阻止继续传播 | 阻止当前节点上的后续监听器 |
|---|---|---|
| `stopPropagation()` | 是 | 否 |
| `stopImmediatePropagation()` | 是 | 是 |

将 `C` 中的方法改成 `e.stopImmediatePropagation()`，则输出是 **A C**（`D` 和 `B` 均不执行）。

补充：`preventDefault()` 阻止浏览器默认行为（若事件可取消），与停止传播不是同一个概念。

## 二、事件传播的三个阶段

```text
window / document / html / body
               ↓ 捕获
             parent  ← A
               ↓
             child   ← C、D（目标阶段）
               ↑
             parent  ← B（本题被阻止）
               ↑ 冒泡
window / document / html / body
```

事件对象常见字段：

- `event.target`：事件最初的目标元素（通常是实际被点击的后代元素）。
- `event.currentTarget`：当前正在执行监听器的元素。
- `event.eventPhase`：1 捕获阶段、2 目标阶段、3 冒泡阶段。
- `event.bubbles`：事件是否支持冒泡。事件委托依赖事件的传播行为；不是所有事件都会冒泡。

## 三、事件委托：只给容器注册一个监听器

```html
<div id="list">
  <button data-id="1"><span>按钮一</span></button>
  <button data-id="2"><span>按钮二</span></button>
</div>
```

```js
const list = document.querySelector("#list");

list.addEventListener("click", (event) => {
  // 点击的可能是 button 内的 span / svg，而不一定是 button 自身。
  const button = event.target.closest("button");

  // 没有命中按钮，或匹配结果不属于当前列表，则忽略。
  if (!button || !list.contains(button)) return;

  const id = button.dataset.id;
  console.log("点击按钮", id);
});
```

### 为什么有效

1. `click` 默认会冒泡。点击按钮或按钮内部元素，事件可以传到 `#list`。
2. `closest("button")` 从事件目标开始向祖先查找，适用于按钮内部有文字、图标等子元素的情况。
3. 监听器只绑定在稳定的容器上，后续新增/删除按钮不需要重新注册监听器。
4. `list.contains(button)` 保证找到的按钮位于委托容器内。

### 注意事项

- 若子元素调用 `stopPropagation()` 阻止事件到达委托容器，容器的冒泡监听器就收不到事件。
- `event.target` 与 `event.currentTarget` 不同：委托监听器中，前者是点击目标，后者通常是 `#list`。
- 事件委托减少监听器数量与动态元素管理成本，但不代表所有场景下都一定比直接监听性能更好。
- 事件委托的选择器应尽量具体，例如 `button[data-action]`，避免误处理其他按钮。

## 四、面试总结

**本题输出 A C D。** `true` 开启捕获；`stopPropagation` 阻止后续传播，不阻止同元素后续监听器；`stopImmediatePropagation` 两者都阻止。动态按钮使用父容器事件委托，结合 `event.target.closest("button")` 识别目标。

## 五、评分依据

**85/100**。用户把输出写成 ABCD，错误地保留了被停止冒泡的 B；其余对 capture、`stopImmediatePropagation` 和事件委托的基本理解正确。需巩固事件传播路径与同一节点多个监听器之间的区别。
