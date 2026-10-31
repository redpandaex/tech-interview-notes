# 第 8 天 · 第 9 题：闭包与垃圾回收

**评分：85/100**

## 1. createHandler 返回后 data 是否立即回收？（50/50）

不会。handler 闭包引用 data；全局变量 handler 指向该函数，因此 data 仍然从 GC Roots 可达。函数调用结束并不意味着闭包捕获的数据失效。

```js
function createHandler() {
  const data = new Array(1000000).fill("hello");
  return function handler() {
    console.log(data.length);
  };
}
const handler = createHandler();
```

引用关系：全局 handler → 闭包函数 → data → 数组。

## 2. 如何让 data 有机会被回收？（35/50）

关键是**可达性**，不必改变函数的词法捕获关系。只要闭包本身不再从 GC Roots 可达，闭包及其独占引用的数据便可被回收。

```js
let handler = createHandler();
handler = null; // 假设没有其他地方引用原闭包
```

GC Roots 通常包括全局对象、活动执行栈等。不可达代表可以被垃圾回收，不保证立即回收。

[原始回答](./answer.md)
