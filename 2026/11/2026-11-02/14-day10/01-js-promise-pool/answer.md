# Day 10 · Q1 — 原始回答与追问

## 初次提交

```ts
async function promisePool<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
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

## 追问：Promise.all 提前 reject 后，其他 Worker 会停吗？

用户回答：“不会，但是 Promise.all 会立即返回失败的结果。完成剩下的两个任务以后继续调度后面的任务。”

**判定：正确。** Promise.all 不取消其他 Promise；剩余 Worker 继续执行，可能继续领取后续任务。

## 用户进一步提问

1. “三个 worker 本质上是三条产线，在不断地执行并且领取后面的任务，是这样吗？”——是。每条产线执行一个任务后继续领取。
2. “为什么取 index 不会跳过 task[0]？”——因为 `nextIndex++` 返回自增前的旧值。
3. “`nextIndex++` 和 `++nextIndex` 的区别？”——表达式值不同，分别返回旧值和新值。
4. “`Array.from({ length: workCount }, () => worker())` 是什么意思？”——按指定长度执行映射函数，启动对应数量的 Worker。
5. 用户复写时误写 `if (Number.isInteger(limit) || limit < 1)`，正确条件是 `if (!Number.isInteger(limit) || limit < 1)`。

## 评分

**95/100**。完整注释与参考实现见 [README.md](./README.md)。