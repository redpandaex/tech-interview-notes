# 第 7 天 · 第 4 题：Promise 组合、并发控制、搜索竞态

**评分：62/100**

## 题目

1. 比较 Promise.all、allSettled、race、any，解释失败后是否取消其他任务。
2. 实现 asyncPool(limit, tasks)，最大并发数 limit，结果按输入顺序，任一失败整体 reject。
3. React 搜索框快速输入造成的竞态条件、AbortController、Debounce 与取消的区别。

## 参考答案

### Promise 组合

- **all**：全部 fulfilled 才 fulfilled；任何一个 rejected 则整体 rejected。不会自动取消其他任务。
- **allSettled**：等待所有 Promise 敲定，结果是 `{status:"fulfilled",value}` 或 `{status:"rejected",reason}`。
- **race**：第一个敲定的结果或拒绝。
- **any**：第一个成功的结果；全部失败时以 AggregateError 拒绝。

示例：

```js
const p1 = Promise.resolve(1);
const p2 = Promise.reject(new Error("failed"));
const p3 = Promise.resolve(3);
await Promise.all([p1,p2,p3]); // rejected: Error("failed")
await Promise.allSettled([p1,p2,p3]);
// [{status:"fulfilled",value:1},{status:"rejected",reason:Error("failed")},{status:"fulfilled",value:3}]
```

### 手写并发控制器

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
    Array.from({length:workerCount}, () => worker())
  );
  return results;
}
```

固定数量的 Worker 各自等待当前任务完成再领取下一个任务；`nextIndex++` 在 await 之前同步执行；按索引保存结果。某任务失败时整体 Promise reject，但已经启动的任务不会自动取消，其他 Worker 可能继续领取任务。

### 搜索竞态

用户输入 r → re → rea → reac → react 时，旧请求可能晚于新请求返回，覆盖最新搜索结果。竞态条件是结果依赖不受控的执行/完成时序。

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

Effect cleanup 取消过期请求；abort 不保证服务端停止处理。**防抖**减少触发频率；**取消/忽略过期结果**保证最新输入对应的结果不被旧请求覆盖。两者可以同时使用，但要考虑防抖等待期间旧请求完成的情况。

[用户原始回答](./answer.md)
