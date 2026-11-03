# 第 11 天 · 第 5 题：JavaScript 事件循环与微任务调度

**评分：90/100**

## 题目

```js
console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

Promise.resolve()
  .then(() => {
    console.log("C");

    queueMicrotask(() => {
      console.log("D");
    });
  })
  .then(() => {
    console.log("E");
  });

queueMicrotask(() => {
  console.log("F");
});

console.log("G");
```

问题：

1. 最终输出顺序是什么？
2. 为什么 D 和 E 按这个顺序执行？

## 一、正确答案

```text
A G C F D E B
```

### 执行时间线

```text
同步执行当前脚本任务
  ├─ console.log("A")             → A
  ├─ setTimeout(B, 0)             → 安排后续定时器任务
  ├─ Promise.resolve().then(C)    → 微任务入队 C
  ├─ queueMicrotask(F)            → 微任务入队 F
  └─ console.log("G")             → G

微任务检查点：按 FIFO 持续执行
  ├─ C
  │   ├─ 输出 C
  │   ├─ queueMicrotask(D)        → D 入队
  │   └─ C 回调正常返回
  │       └─ 第一个 then 返回的 Promise 兑现
  │           └─ 第二个 then(E) 的反应任务入队
  ├─ F                             → F
  ├─ D                             → D
  └─ E                             → E

后续定时器任务
  └─ B                             → B
```

### 微任务队列变化

| 时机 | 微任务队列（队首在左） |
|---|---|
| 当前同步脚本结束 | `[C, F]` |
| C 内部调用 `queueMicrotask(D)` | `[F, D]` |
| C 完成并使前一个 `then` 返回的 Promise 兑现 | `[F, D, E]` |
| F 执行后 | `[D, E]` |
| D 执行后 | `[E]` |
| E 执行后 | `[]` |

## 二、为什么 D 先于 E？

重点是**链式 Promise 的第二个 `then` 不会在最初同步代码执行时就把 E 入队**。

```js
Promise.resolve()
  .then(() => {
    queueMicrotask(() => console.log("D"));
  })
  .then(() => console.log("E"));
```

第一个 `then` 返回一个新的 Promise；第二个 `then` 是注册在这个新 Promise 上的回调。

- 第一个 `then` 的回调开始执行。
- 在回调中，`queueMicrotask(D)` 立即把 D 加到队尾。
- 回调返回后，第一个 `then` 返回的 Promise 才兑现，E 才会作为 Promise reaction job 排入微任务队列。
- 因为 D 先入队，D 在 E 前执行。

**注意：**如果第一个 `then` 返回一个待兑现的 Promise 或 thenable，后续 E 的调度还会受到 Promise 采纳/兑现过程影响，不能简单理解为“每个 `then` 一开始就排队”。

## 三、任务（task）与微任务（microtask）

在浏览器环境中：

- 当前脚本执行属于一个任务。
- `setTimeout` 回调通常在后续任务中执行；延迟 `0` 不代表立即执行，也不保证严格的 0 毫秒。
- `Promise.then` 回调和 `queueMicrotask` 回调通过微任务调度。
- 在一个任务结束后，浏览器执行微任务检查点，持续处理微任务队列，**包括微任务执行过程中新增的微任务**。
- 微任务处理完后，浏览器才有机会进行渲染并继续选择后续任务；是否实际渲染取决于浏览器调度。

```text
一个任务执行
    ↓
清空微任务队列（期间新增的微任务也执行）
    ↓
浏览器可能进行渲染
    ↓
执行下一个任务
```

### 常见陷阱

1. **`setTimeout(fn, 0)` 不会抢在当前脚本的微任务之前执行。**
2. **链式 `then` 的后续回调，取决于前一个 `then` 返回的 Promise 的状态变化。**
3. **微任务可能在执行过程中继续产生微任务，不能只处理一轮初始队列。**
4. **递归地无限安排微任务可能让后续任务和渲染迟迟得不到执行机会。**
5. **不同运行环境的任务调度细节可能不同**；本题按浏览器环境讨论。

## 四、面试回答模板

> 输出顺序是 A、G、C、F、D、E、B。A 和 G 是同步输出；初始微任务为 C、F。C 执行时先把 D 入队，随后 C 所属的 Promise 兑现才使链式的 E 入队，因此微任务依次执行 C、F、D、E。微任务清空后，定时器任务才输出 B。

## 五、评分依据

**90/100**。用户给出的 `A-G-C-F-D-E` 前六项完全正确，漏掉定时器任务 B；FIFO 原理正确，但未明确说明 E 是在前一个 `then` 返回的 Promise 兑现后才入队。无须追问。
