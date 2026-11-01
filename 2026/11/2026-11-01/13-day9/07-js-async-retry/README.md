# 第 9 天 · 第 7 题：异步重试 retry

**评分：100/100**

## 题目

实现 `retry<T>(fn: () => Promise<T>, times: number): Promise<T>`：最多执行 times 次，成功立即返回；失败继续尝试；全部失败抛出最后一次错误。无需延迟、退避或取消。

## 标准实现

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

## 评分依据

- 功能正确性（60/60）：循环次数无 off-by-one；成功立即返回；失败继续重试；最后抛出最后一次异常。
- 边界与类型安全（40/40）：正整数校验合理；错误类型用 unknown 而非 any。
- `return await fn()` 可让 Promise 拒绝被当前 `try/catch` 捕获；直接 `return fn()` 则不能在当前 `catch` 中捕获之后发生的拒绝。

## 生产实践补充

重试前需考虑幂等性、错误类型、指数退避与抖动、超时和取消等。本题不要求，不扣分。

[原始回答](./answer.md)
