# 浏览器 INP 与 Long Task 优化 · 追问与答题记录

**状态：主问题部分作答，第一轮追问待答**

## 用户原始回答（原文）

> 因为浏览器的是单线程,js在处理的过程中渲染页面也会被卡住
> 应该可以

对应提问：
1. 用户点击后主线程执行 800ms 同步任务，为什么可能无法及时更新页面？
2. 把同步代码放进 `Promise.then()` 能不能解决页面卡顿？为什么？

## 面试官点评

- 第 1 问基本正确：页面 JavaScript 和大量渲染工作通常共享主线程，长时间执行同步 JS 会阻塞主线程；但不能笼统说“浏览器整体单线程”。
- 第 2 问不正确：`Promise.then` 是微任务，仍在主线程执行；微任务检查点通常先于浏览器获得下一次渲染机会。把 800ms 计算放进微任务不能自动分片或转移线程。
- 关键区分：异步调度 ≠ 多线程执行 ≠ 不阻塞主线程。
- 本题尚未完成，暂不做最终评分。

## 第一轮追问（待答）

```js
button.addEventListener("click", () => {
  document.querySelector("#status").textContent = "处理中...";

  setTimeout(() => {
    const start = performance.now();
    while (performance.now() - start < 800) {
      // 模拟耗时计算
    }
    document.querySelector("#status").textContent = "完成";
  }, 0);
});
```

1. `setTimeout(fn, 0)` 回调属于宏任务还是微任务？
2. 相比 `Promise.then()`，是否有可能先看到“处理中...”？
3. 是否能彻底解决 800ms 卡顿？为什么？

## 第二轮追问（如有）

待第一轮回答后决定；最多两轮。
