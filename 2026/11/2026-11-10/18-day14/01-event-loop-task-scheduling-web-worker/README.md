# 第 14 天 · 第 1 题：Event Loop、微任务饥饿与任务调度

**方向：JavaScript / 浏览器事件循环 / 性能优化 / Web Worker**  
**难度：L1–L2**  
**评分：88/100**

## 一、原题：Event Loop 与微任务

```js
console.log("A");

setTimeout(() => {
  console.log("B");

  Promise.resolve().then(() => {
    console.log("C");
  });
}, 0);

Promise.resolve().then(() => {
  console.log("D");

  setTimeout(() => {
    console.log("E");
  }, 0);
});

queueMicrotask(() => {
  console.log("F");
});

console.log("G");
```

正确输出：

```text
A → G → D → F → B → C → E
```

解释：
1. 当前 Task 中先执行同步代码，输出 A、G。
2. 当前 Task 结束后执行微任务，按队列顺序输出 D、F。
3. 两个定时器分别在 D 的回调中和最初同步代码中注册；最初注册的 B 定时器先执行。
4. B 回调中添加微任务 C。执行完 B 后，先清空微任务队列，输出 C。
5. 最后执行 E。

浏览器通常在 Task 之间的微任务检查点清空微任务队列，然后才有机会进行渲染等工作。宏任务/微任务是调度类别，不是简单的同步/异步分类。

## 二、宏任务与微任务

常见 Task 来源包括定时器回调、用户交互事件回调等；常见微任务包括 Promise reaction（then/catch/finally）、queueMicrotask、MutationObserver 回调。

简化模型：

```text
执行一个 Task
    ↓
同步调用栈清空
    ↓
清空微任务队列
    ↓
浏览器可能进行渲染
    ↓
执行后续 Task
```

## 三、微任务饥饿（Microtask Starvation）

示例：

```js
function loop() {
  queueMicrotask(loop);
}

loop();

setTimeout(() => {
  console.log("timeout");
}, 0);
```

微任务执行时又不断创建新的微任务，导致微任务检查点无法结束，后续 Task（例如定时器）得不到执行机会，浏览器也可能无法及时渲染或响应用户操作。

## 四、分批任务：queueMicrotask vs setTimeout

```js
// 微任务持续排队：可能让微任务检查点一直无法结束
function process() {
  processBatch();
  if (hasMore()) queueMicrotask(process);
}

// 每批安排到后续 Task：浏览器有机会处理其他工作
function process() {
  processBatch();
  if (hasMore()) setTimeout(process, 0);
}
```

对持续的大任务，setTimeout 分批通常比递归微任务更有利于保持页面响应，因为每批之间可以让出当前微任务检查点，后续 Task 有机会执行。

但 setTimeout 的延迟和调度并不精确，不能保证固定时间执行。

## 五、requestIdleCallback 与 requestAnimationFrame

| API | 用途 | 注意事项 |
|---|---|---|
| requestIdleCallback | 在浏览器空闲时安排非紧急工作 | 兼容性需考虑；可使用 timeout；仍在主线程 |
| requestAnimationFrame | 在下一次重绘前执行视觉更新 | 不适合长时间计算，否则会影响帧率 |

requestIdleCallback 示例：

```js
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && hasWork()) {
    processOneSmallUnit();
  }
}, { timeout: 1000 });
```

requestAnimationFrame 更适合动画、Canvas 绘制或批量视觉更新，不是通用后台计算 API。

## 六、100 万条数据排序：优先 Web Worker

题目要求：
- 不阻塞主线程。
- 尽量不影响交互。
- 完成后展示结果。

A：requestIdleCallback 分批处理。它可以把计算切成小段，在主线程空闲时继续执行，但仍占用主线程；浏览器繁忙时也可能推迟任务。全局排序也不能简单把各段独立排序就视为整体有序，通常还需要设计分段排序与合并过程。

C：Web Worker。把 CPU 密集型排序放在 Worker 线程执行，主线程继续处理输入、渲染和交互。完成后通过 postMessage 把结果发回主线程。

示例：

```js
// main.js
const worker = new Worker(
  new URL("./sort.worker.js", import.meta.url)
);

worker.postMessage(data);

worker.onmessage = (event) => {
  const sortedData = event.data;
  render(sortedData);
};
```

```js
// sort.worker.js
self.onmessage = (event) => {
  const data = event.data;
  data.sort((a, b) => a - b);
  self.postMessage(data);
};
```

工程注意：
- postMessage 默认使用 Structured Clone，复制大量数据会产生序列化和内存成本。
- 对 ArrayBuffer 等支持转移的对象，可考虑 Transferable Objects，避免复制底层缓冲区。
- Worker 不直接操作 DOM，UI 更新仍由主线程完成。
- 100 万条记录不应直接创建 100 万个 DOM 节点，应考虑虚拟列表、分页或聚合展示。
- Web Worker 适合 CPU 密集任务；若任务可轻松切片且很短，idle callback 也可能足够。

## 七、面试简答模板

> 浏览器事件循环会执行一个 Task，调用栈清空后进行微任务检查点，清空微任务队列，然后浏览器才有机会渲染。若微任务不断创建新微任务，会造成 Microtask Starvation，使定时器和渲染得不到机会。对于主线程上的可切片非紧急工作，可以使用 setTimeout 或 requestIdleCallback 分批；requestAnimationFrame 用于重绘前的视觉更新。对于 100 万条数据这类 CPU 密集型计算，更适合放到 Web Worker，完成后通过 postMessage 返回结果，主线程负责更新 UI，并考虑消息复制成本和虚拟列表。

## 八、用户回答与反馈摘要

主问题：
- 输出顺序回答：A-G-D-F-B-C-E，正确。
- 宏任务/微任务回答：理解 Promise.then 属于微任务；补充调度模型，微任务是在当前 Task 结束后清空。
- 无限微任务回答：能识别浏览器卡顿和微任务持续执行，正确。

第一次追问：
- 方案 A（queueMicrotask 递归）与方案 B（setTimeout 分批）选择 B，正确。
- 记得 IDLE API 和 RAF；补充 requestIdleCallback 用于非紧急空闲任务，requestAnimationFrame 用于重绘前视觉更新。

第二次追问：
- 对 100 万条数据排序，用户回答 A 或 C 都可以。
- 结论：两者在不同条件下都能用，但本题“不阻塞主线程”的强要求下优先 C。A 仍在主线程运行，只能通过让出执行机会降低影响；C 将计算移到 Worker 线程。用户需要进一步区分“主线程分批调度”与“真正移出主线程”。

## 九、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 28/30 |
| 解决方案 | 34/40 |
| 原理理解 | 18/20 |
| 边界意识 | 8/10 |
| **总分** | **88/100** |
