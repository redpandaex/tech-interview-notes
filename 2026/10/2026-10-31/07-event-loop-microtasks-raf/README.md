# 第 7 天 · 第 7 题：事件循环、微任务与 requestAnimationFrame

**评分：90/100**

## 问题 1：执行顺序

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => {
  console.log("C");
  setTimeout(() => console.log("D"), 0);
});
queueMicrotask(() => console.log("E"));
console.log("F");
```

**输出：A F C E B D。**

同步代码输出 A、F；微任务先执行 Promise.then（输出 C 并注册 D），再执行 queueMicrotask（输出 E）；随后执行计时器 B、D。setTimeout(fn, 0) 只注册定时器，不保证立即执行；微任务完成后，浏览器可能进行渲染或执行其他任务。

## 问题 2：async/await

```js
async function foo() {
  console.log(1);
  await Promise.resolve();
  console.log(2);
}
console.log(3);
foo();
Promise.resolve().then(() => console.log(4));
console.log(5);
```

**输出：3 1 5 2 4。**

async 函数在第一个 await 之前同步执行。即使 await 的 Promise 已兑现，后续代码也会通过微任务机制继续执行，因此 2、4 都在同步输出 5 之后。

## 问题 3：微任务饥饿

```js
function loop() {
  queueMicrotask(loop);
}
loop();
```

每个微任务继续添加新微任务，队列无法清空，浏览器可能无法正常渲染和响应输入。改成 setTimeout(loop, 0) 后，任务之间浏览器有机会渲染，但耗时任务仍可能卡顿。

## requestAnimationFrame

**requestAnimationFrame 回调通常在下一次绘制之前执行，而不是绘制之后。** 它与浏览器刷新节奏协调，适合动画；setTimeout 由计时器与事件循环调度，不保证固定间隔或与刷新率同步。

```js
const box = document.querySelector(".box");
let start = null;
function animate(timestamp) {
  if (start === null) start = timestamp;
  const progress = Math.min((timestamp - start) / 1000, 1);
  box.style.transform = `translateX(${progress * 300}px)`;
  if (progress < 1) requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

## 评价

两个输出顺序完全正确，微任务饥饿理解正确。需要纠正 rAF 执行时机，以及 setTimeout 不保证精确执行时间。

[用户原始回答](./answer.md)
