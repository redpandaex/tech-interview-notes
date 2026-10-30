# Promise 四种组合方法、并发控制与请求竞态（补充）

> 补充日期：2026-10-31。对应第 7 天第 4 题复习。原有 Day 5 Q7 笔记见本目录 README.md。

## 1. 四种组合 API

| API | 敲定规则 | 结果 |
|---|---|---|
| `Promise.all` | 任何一个 rejected，整体 rejected；全部 fulfilled 才成功 | 所有成功值按输入顺序排列 |
| `Promise.allSettled` | 等所有输入都 settled | `{status:"fulfilled",value}` 或 `{status:"rejected",reason}` 数组 |
| `Promise.race` | 第一个 settled | 第一个的成功值或失败原因 |
| `Promise.any` | 第一个 fulfilled；全部 rejected 才失败 | 首个成功值，全部失败则 `AggregateError` |

```js
const p1 = Promise.resolve(1);
const p2 = Promise.reject(new Error("failed"));
const p3 = Promise.resolve(3);

await Promise.all([p1, p2, p3]); // reject: Error("failed")
await Promise.allSettled([p1, p2, p3]);
// [
//   { status: "fulfilled", value: 1 },
//   { status: "rejected", reason: Error("failed") },
//   { status: "fulfilled", value: 3 }
// ]
```

`Promise.all` 不负责启动已有任务，也不会在拒绝时自动取消其他 Promise；对 fetch 取消需传入 AbortSignal。fetch 收到 HTTP 4xx/5xx 通常不会直接 rejected，需检查 response.ok。

## 2. 最大并发数 asyncPool：Worker 池实现

要求：同一时刻最多运行 limit 个任务；任务完成后立即启动下一个；按输入顺序返回；任意任务拒绝时整体拒绝。

```ts
async function asyncPool<T>(
  limit: number,
  tasks: Array<() => Promise<T>>
): Promise<T[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("limit 必须是正整数");
  }

  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      const result = await tasks[index]();
      results[index] = result;
    }
  }

  const workerCount = Math.min(limit, tasks.length);
  await Promise.all(
    Array.from({ length: workerCount }, () => worker())
  );
  return results;
}
```

原理：

1. 仅启动 `min(limit, tasks.length)` 个 Worker；每个 Worker 在 `await` 结束后才领取下一项，故同时运行的任务不超过上限。
2. `nextIndex++` 在 `await` 前同步执行，在同一 JS 事件循环中能确保 Worker 获得不同索引。
3. 使用 `results[index]` 保证输出与原始 tasks 顺序一致，不受任务完成顺序影响。
4. `Promise.all(workers)` 会在 Worker 拒绝时拒绝，但**不取消已启动任务**。该基础版失败后，其他 Worker 仍可能继续领取新任务；若要求失败后停止调度，需要加入共享 stopped 标记，并视情况接入取消机制。

测试：

```ts
const delay = <T,>(ms: number, value: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), ms));

const result = await asyncPool(3, [
  () => delay(300, "A"),
  () => delay(100, "B"),
  () => delay(200, "C"),
  () => delay(50, "D")
]);

console.log(result); // ["A", "B", "C", "D"]
```

## 3. 搜索请求竞态：AbortController + Effect 清理

快速输入 r → re → react 时，旧请求可能晚于新请求完成，覆盖最新结果。该问题是**竞态条件**：结果依赖不受控的完成时序。

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function search() {
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(keyword)}`,
        { signal: controller.signal }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!controller.signal.aborted) setResults(data);
    } catch (error) {
      if (!controller.signal.aborted) console.error(error);
    }
  }

  void search();
  return () => controller.abort();
}, [keyword]);
```

Effect 依赖变化时，先清理旧 Effect，再执行新 Effect。Abort 不能保证服务器停止处理已收到的请求；异步链路中必要时还应检查 signal.aborted。

**防抖 Debounce** 减少输入产生的请求次数；**取消/忽略过期结果** 防止旧请求覆盖新结果。二者解决不同问题，可以组合，但要特别处理防抖等待期间旧请求返回的情况。
