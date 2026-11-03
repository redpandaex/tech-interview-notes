# 第 11 天 · 第 7 题：Map、WeakMap 与垃圾回收

**得分：85/100**

## 题目

```js
const map = new Map();
const weakMap = new WeakMap();

let element = document.createElement("div");

map.set(element, { count: 1 });
weakMap.set(element, { count: 1 });

element = null;
```

1. Map 和 WeakMap 对对象键的引用有何区别？这个 DOM 元素能否被垃圾回收？
2. 为什么 WeakMap 不支持 `keys()`、`values()`、`size`？举出一个使用场景。

## 一、强引用与弱引用

**Map 会强引用其键，WeakMap 不会仅因为键存在而阻止对象被回收。**

```text
仍然可达的 map
   └─ 强引用 ──> DOM 元素
                    ↑
weakMap ── 弱键 ───┘

element = null // 只清除变量 element 的引用
```

只要 `map` 可达、对应条目尚未删除，DOM 元素仍然可达，因此不能被垃圾回收。即使 `element = null`，也只是删除一个变量所持有的引用，并未删除 Map 内部的引用。

```js
// 在真实业务中，应在 element 仍可引用时删除键：
map.delete(element);

// 或者直接清空整张 Map：
map.clear();
```

在本题 `element = null` 后，已不能通过该变量调用 `map.delete(element)` 删除原键；可以使用 `map.clear()`，或者在清空之前保留原对象的引用并据此删除。假设没有其他强引用，那么清除 Map 中的条目后，DOM 元素便**有资格**被垃圾回收；是否立即执行回收由 JavaScript 引擎决定。

### 关键区别

| 属性 | Map | WeakMap |
|---|---|---|
| 键类型 | 任意值 | 对象及非注册 Symbol（依语言规范） |
| 对对象键的引用 | 强引用 | 弱引用 |
| 遍历 | 支持 `keys/values/entries` | 不支持 |
| `size` | 支持 | 不支持 |
| 典型用途 | 通用键值存储 | 对象关联元数据、对象生命周期相关缓存 |

## 二、为什么 WeakMap 不可遍历？

WeakMap 的键可能因垃圾回收而消失。垃圾回收的具体时机不可预测，因此暴露完整键列表或 `size` 会让程序观察到对象何时被回收，且遍历行为无法提供稳定的集合语义。

可用操作：

```js
const metadata = new WeakMap();
const obj = {};

metadata.set(obj, { clicks: 0 });
metadata.has(obj);    // true
metadata.get(obj);    // { clicks: 0 }
metadata.delete(obj); // true
```

没有 `keys()`、`values()`、`entries()`、`forEach()` 或 `size`。

## 三、典型应用：DOM 元素的附加状态

```js
const buttonState = new WeakMap();

function bindButton(button) {
  buttonState.set(button, { clickCount: 0 });

  button.addEventListener("click", () => {
    const state = buttonState.get(button);
    if (state) state.clickCount++;
  });
}
```

WeakMap 可以为对象关联状态而不单凭这张映射延长对象的生命周期。当 DOM 元素被移除、没有其他强引用时，对应键及其关联值可以被清理。**注意：**若程序其他位置仍持有该 DOM 元素或监听器相关的可达对象，WeakMap 不会神奇地解除那些强引用。

更多应用：

- 对象关联的元数据；
- 不希望缓存阻止对象释放的计算结果；
- 模块内部对象私有状态。

## 四、循环引用与垃圾回收

**循环引用不等于内存泄漏。**

```js
let a = {};
let b = {};

a.peer = b;
b.peer = a;

a = null;
b = null;
```

现代 JavaScript 引擎主要依据**可达性**判断对象是否可以回收。即使两个对象互相引用，只要它们整体无法从根对象到达，就可以被回收。

WeakMap 适合避免**缓存或关联表对对象键的强引用**，而不是“专门解决循环引用”。

## 五、进阶：WeakMap 的值与键的关系

WeakMap 的弱性针对**键**。值可以是任意类型；规范对键和值的关联采用适当的可达性处理（常用 ephemeron 语义），避免仅因值反向引用键就永久阻止键的回收。实际判断时仍应先检查是否存在来自 WeakMap 之外的强引用。

## 六、面试回答模板

> Map 对对象键持有强引用，WeakMap 对对象键使用弱引用。题目中即使把 element 设为 null，Map 仍然持有它，因此不能回收。WeakMap 不提供遍历和 size，是因为键可能随垃圾回收而消失，回收时机不可预测。它适合给 DOM 元素或其他对象附加状态，而不希望映射本身延长对象生命周期。

## 七、评分

**85/100**。强弱引用、Map 导致对象仍然可达，以及 WeakMap 不支持遍历的原因均基本掌握。主要不足是把“循环引用”当成典型使用场景：现代 GC 能处理不可达的循环引用，WeakMap 主要用于避免关联数据结构持有强引用。
