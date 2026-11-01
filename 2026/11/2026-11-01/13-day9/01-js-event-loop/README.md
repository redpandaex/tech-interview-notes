# 第 9 天 · 第 1 题：JavaScript 事件循环

**评分：95/100**

## 题目

```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => {
  console.log(3);
  setTimeout(() => console.log(4), 0);
});
queueMicrotask(() => console.log(5));
console.log(6);
```

## 正确输出（50/50）

```text
1 → 6 → 3 → 5 → 2 → 4
```

当前任务先执行同步代码输出 1、6。任务末尾执行微任务检查点，按顺序运行 Promise 回调（输出 3 并注册第二个定时器）和 queueMicrotask（输出 5）。之后依次处理定时器任务，输出 2、4。

## 事件循环原理（45/50）

- 一个任务执行结束后，浏览器运行微任务检查点，持续处理微任务队列直到清空。
- 微任务执行期间新加入的微任务，也会在该检查点继续执行。
- `setTimeout(fn, 0)` 只是安排定时器任务，不保证 0ms 后立即执行；回调还受任务调度、主线程忙碌及嵌套定时器最小延迟等影响。
- HTML 标准主要使用 task 和 microtask；macrotask（宏任务）是常见但非正式的称呼。

### 补充示例

```js
queueMicrotask(() => {
  console.log("A");
  queueMicrotask(() => console.log("C"));
});
queueMicrotask(() => console.log("B"));
// A B C
```

[原始回答](./answer.md)
