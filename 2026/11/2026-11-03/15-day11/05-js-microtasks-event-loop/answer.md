# 第 11 天 · 第 5 题：用户原始回答与评分

**最终得分：90/100**

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

问题：输出顺序，以及 D 和 E 的顺序原因。

## 用户原始回答（原文）

> 1. A-G-C-F-D-E
> 2. 因为遇到微任务时要先按照FIFO的顺序加入到微任务队列

## 反馈

- **正确顺序：`A-G-C-F-D-E-B`**。用户前六项全部正确，漏掉了 `setTimeout` 的 B。
- FIFO 理解正确。初始微任务队列是 `[C, F]`；C 执行时 D 先入队，C 回调返回后，链式第二个 `then` 的 E 才入队，因此执行顺序为 C、F、D、E。
- 微任务队列清空后才轮到定时器任务 B。

## 最终评分

**90/100**。核心微任务顺序掌握良好；需注意完整列出所有输出，并理解链式 Promise 回调何时入队。

详细答案见 [README.md](./README.md)。
