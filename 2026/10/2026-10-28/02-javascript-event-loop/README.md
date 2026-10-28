# 第 5 天 · 第 2 题：JavaScript 事件循环

**日期：** 2026-10-28
**评分：65/100**

## 题目

```js
console.log("1");

setTimeout(() => {
  console.log("2");
  Promise.resolve().then(() => {
    console.log("3");
  });
}, 0);

Promise.resolve().then(() => {
  console.log("4");
  setTimeout(() => {
    console.log("5");
  }, 0);
});

queueMicrotask(() => {
  console.log("6");
});

console.log("7");
```

1. 最终输出顺序？
2. Promise.then 和 queueMicrotask 为什么按该顺序执行？
3. 浏览器任务与微任务的执行顺序？不断产生新微任务会怎样？

## 正确答案

```text
1
7
4
6
2
3
5
```

### 执行过程

1. 同步脚本输出 `1`；注册第一个 setTimeout；将 Promise.then（输出 4）与 queueMicrotask（输出 6）依次加入微任务队列；输出 `7`。
2. 当前脚本任务结束，清空微任务队列：输出 `4`，并注册第二个 setTimeout（输出 5）；然后输出 `6`。
3. 第一个 setTimeout 任务执行，输出 `2`，添加 Promise.then 微任务（输出 3）。
4. 当前定时器任务结束后先执行微任务检查点，输出 `3`。
5. 执行第二个 setTimeout，输出 `5`。

### Promise.then 与 queueMicrotask

两者都能安排微任务；通常按入队先后顺序执行，不存在 Promise.then 天然高于 queueMicrotask 的优先级。

```js
queueMicrotask(() => console.log("A"));
Promise.resolve().then(() => console.log("B"));
queueMicrotask(() => console.log("C"));
// A B C
```

### 微任务饥饿不等于调用栈溢出

```js
function loop() {
  queueMicrotask(loop);
}
loop();
```

在微任务检查点，执行微任务期间产生的新微任务也会继续执行；如果持续产生，后续任务与渲染可能长期得不到机会，造成 **Microtask Starvation（微任务饥饿）**。它不是直接同步递归调用，因此通常不导致同步递归那样的栈溢出。

```js
function recurse() { recurse(); }
recurse(); // 同步无限递归，通常栈溢出
```

面试中“一个任务 → 清空微任务 → 下一个任务”的简化模型可用于推导本题；实际浏览器还涉及渲染时机、任务源等细节。

## 评分

| 考察点 | 得分 |
|---|---:|
| 输出顺序 | 15/35 |
| Promise 与 queueMicrotask | 20/25 |
| 事件循环与微任务饥饿 | 30/40 |
| **总分** | **65/100** |

用户原始回答与评价见 [answer.md](./answer.md)。
