# 第 9 天 · 第 7 题：原始回答

评分：100/100

```ts
async function retry<T>(
  fn: () => Promise<T>,
  times: number
): Promise<T> {
  if (!Number.isInteger(times) || times <= 0) {
    throw new RangeError("times 必须是正整数");
  }

  let lastError: unknown;

  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
```

[参考答案](./README.md)
