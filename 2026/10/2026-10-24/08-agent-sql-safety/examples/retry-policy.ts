type FailureKind = "syntax" | "schema" | "business" | "timeout" | "permission";
type Failure = { kind: FailureKind; message: string };
export function shouldRetry(
  failure: Failure,
  attempt: number,
  maxAttempts = 3,
): boolean {
  if (attempt >= maxAttempts) return false;
  // 权限问题绝不能通过让模型改写绕过；超时也不要盲目重复执行。
  return failure.kind === "syntax" || failure.kind === "schema";
}
// 除次数外，真实 Agent 还需总时间预算、幂等标识与重复错误检测。
