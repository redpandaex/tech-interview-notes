# Day 10 · Q1 — Promise 并发池（95/100）

## 题目

实现 `promisePool<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]>`：
- 最多同时执行 `limit` 个任务；
- 一个任务完成后，立即领取下一个任务；
- 结果保持输入顺序；
- 任意任务失败，返回的 Promise 拒绝；
- 不要求取消与重试。

## 参考实现（带注释）

```ts
async function promisePool<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  // 1. 并发限制必须是正整数；注意这里要有 !
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("limit 必须是正整数");
  }

  // 2. 提前创建结果数组，按任务原始下标存放结果
  const results: T[] = new Array(tasks.length);

  // 3. 所有 Worker 共享的任务领取游标
  let nextIndex = 0;

  // 4. 一个 Worker 就是一条反复领取任务的“生产线”
  async function worker(): Promise<void> {
    // 还有任务未被领取，就继续工作
    while (nextIndex < tasks.length) {
      // 后置自增：先返回旧索引，再将 nextIndex 加 1
      // 第一次拿到 0，因此不会漏掉 tasks[0]
      // 此处没有 await；在同一个 JS Agent 内，不会被其他微任务插入执行
      const index = nextIndex++;

      // 执行当前任务；等待期间其他 Worker 可以继续推进
      const result = await tasks[index]();

      // 按原始下标保存，不受任务完成先后影响
      results[index] = result;
    }
  }

  // 5. Worker 数量不超过任务数量
  const workerCount = Math.min(limit, tasks.length);

  // 6. Array.from 的映射函数调用 worker() workerCount 次
  // Promise.all 等待所有 Worker 成功；任意失败则 reject
  await Promise.all(
    Array.from({ length: workerCount }, () => worker())
  );

  // 7. 全部成功后返回按输入顺序排列的结果
  return results;
}
```

## 核心原理：固定数量的消费者 + 共享索引

`limit = 3` 相当于三条生产线：Worker A/B/C 分别领取最初三个任务，谁先完成，谁就通过共享的 `nextIndex` 领取下一项。Worker 与任务没有固定绑定关系。

```text
任务：0 1 2 3 4 5
初始：W1→0  W2→1  W3→2
任务 1 最先完成：W2→3
任务 2 完成：W3→4
任务 0 完成：W1→5
```

`while` 不能简单删除：如果每个 Worker 只领取一次，那么 100 个任务、3 个 Worker 最多只执行 3 个任务。

## Run-to-Completion 与 `nextIndex++`

在同一个普通 JS Agent 内，同步代码执行期间不会被其他 Promise 微任务抢占。领取索引发生在 `await` 之前，因此多个 Worker 不会在这段同步操作中同时拿到相同的索引。

```js
let nextIndex = 0;
const index = nextIndex++; // index === 0; nextIndex === 1
```

- `i++`：表达式返回旧值，然后自增。
- `++i`：先自增，表达式返回新值。若直接写 `const index = ++nextIndex`，第一次会跳过 `tasks[0]`。
- 这里的安全性不是说 `++` 在真正的共享内存多线程环境中天然原子，而是执行过程中没有异步让出。

## `Array.from({ length: n }, fn)`

```js
Array.from({ length: 3 }, (_, i) => i); // [0, 1, 2]
Array.from({ length: 3 }, () => worker()); // 调用 worker() 三次，返回三个 Promise
```

`{ length: 3 }` 是类数组对象，`Array.from` 创建三个数组元素，并对每个元素调用映射函数。与之不同，`new Array(3).map(fn)` 的 `map` 会跳过三个空槽，不会调用 `fn`。

## Fail-Fast 不等于停止调度

`Promise.all` 任意输入 Promise reject 时，会立即使聚合 Promise reject，但**不会取消其他 Worker**。它们完成正在执行的任务后，仍可能继续领取新任务。

若业务要求“首个失败后不再领取新任务”，需额外维护共享停止标记；已经启动的请求要想取消，需要任务本身支持取消机制（例如 `AbortController`）。本题没有要求停止调度或取消。

## 其他边界

- `tasks = []` 时返回空数组。
- `limit` 不是正整数时抛 `RangeError`。
- 任务同步抛错也会使对应 async Worker reject。
- `fetch` 遇到 HTTP 4xx/5xx 默认不 reject；如要把非 2xx 视为失败，应自行检查 `response.ok`。

## 评分

**95/100**。实现满足要求，追问正确理解了 `Promise.all` 不取消其他 Worker；后续重点复习自增运算符、`Array.from`、Worker Pool 的循环领取机制。