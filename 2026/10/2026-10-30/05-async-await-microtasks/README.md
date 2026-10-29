# 第 6 天 · 第 5 题：async/await 与微任务执行顺序

**评分：65/100**

## 题目

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
async function foo() {
  console.log("C");
  await Promise.resolve();
  console.log("D");
  await Promise.resolve();
  console.log("E");
}
foo();
Promise.resolve().then(() => {
  console.log("F");
  queueMicrotask(() => console.log("G"));
});
console.log("H");
```

1. 写出输出顺序并解释。
2. 解释 await Promise.resolve(2) 后代码为何不会同步执行。
3. 为什么微任务里创建的微任务会先于 setTimeout 回调执行。

## 参考答案

**正确顺序：A → C → H → D → F → E → G → B。**

同步阶段打印 A，注册定时器，调用 foo 同步打印 C，遇到第一个 await 暂停并安排恢复 foo 的微任务 D；注册 Promise.then 微任务 F；打印 H。

微任务队列起初是 [D,F]。执行 D 时遇到第二个 await，将 E 加入队尾，队列变成 [F,E]。执行 F 时 queueMicrotask 将 G 加入队尾，队列变成 [E,G]。随后 E、G 依次执行。微任务清空后，才执行定时器 B。

`async` 函数在第一个 `await` 之前同步执行。`await` 会暂停当前 async 函数的后续执行，不会阻塞 JS 主线程。即使 await 后是立即兑现的 Promise 或普通值，后续代码也异步恢复。可以用 `Promise.resolve(value).then(...)` 作为近似心智模型，但不是规范层面完全等价的源码替换。

微任务中通过 `queueMicrotask` 创建的新任务只是排入微任务队列，不会立即压入当前调用栈。浏览器在微任务检查点持续清空微任务队列，包括处理过程中新增的微任务，然后才进入后续任务。

## 评分

| 项目 | 得分 |
|---|---:|
| 执行顺序 | 25/40 |
| await 执行机制 | 25/30 |
| 微任务与宏任务 | 15/30 |
| **总分** | **65/100** |

[原始回答及点评](./answer.md)
