# 第 1 题追问与答题记录

> 根据 2026-10-24 的交互整理。保留用户的关键判断和实际误区，不把回答改写为“全部正确”。

| 轮次 | 问题 | 用户回答摘要 | 点评 |
| --- | --- | --- | --- |
| 1 | A/B/C/D/E/F/G 的执行顺序 | `A E C D F B`（遗漏 G）；认为脚本之后先宏任务 | 同步阶段还会输出 G，正确为 `A E G C D F B`；当前任务后先清空微任务 |
| 2 | 在微任务 4 内创建 5 | `1 7 4 5 6 2 3`，认为 5 立即执行 | 应为 `1 7 4 6 5 2 3`：5 加到微任务队尾 |
| 3 | 微任务无限递归 | timer 不执行、页面卡死；对递归 timer 误认为输出 0 | 核心判断正确；0 是定时器延迟参数，递归 timer 不打印 0 |
| 4 | `await 100` | `3 1 5 2 4`；把 await 理解为 yield 语法糖，会阻塞同步代码 | 顺序正确；await 只暂停当前 async 函数，不会阻塞主线程 |
| 5 | Promise executor/resolve | `5 1 2 3 7 4 6`；executor 同步、resolve 不阻断执行 | 正确 |
| 6 | Node `process.nextTick` | `A F D C E B`；联想到 Vue nextTick | 顺序正确；两者是不同 API |
| 7 | Node `setImmediate` | A 在 G 前；认为顶层 C 在 B 前；I/O 内 F 在 E 前 | 第 1、3 点正确；顶层 B/C 顺序不保证 |
| 8 | React Fiber / 浏览器调度 | 记得 Fiber 可中断；混淆 RAF 和 idle；认为不能任意打断 JS | Fiber 方向正确；RAF 在下一次重绘前；idle 在空闲时回调 |

## 需反复巩固

1. 微任务遵循 FIFO，新排入的不插队。
2. 区分“暂停当前 async 函数”和“阻塞整个 JS 线程”。
3. `Promise.resolve`、Promise executor、`.then` 的不同执行时机。
4. Node 的 `nextTick`、`setImmediate` 与 Vue `nextTick`。
5. `requestAnimationFrame` 与 `requestIdleCallback` 的回调时机。

> 流程约定：以后每道主问题最多追问 1～2 次，额外知识点归档，不继续无限追问。
