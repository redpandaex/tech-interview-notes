import type { TaskEvent, TaskSnapshot } from "./task-protocol";

const terminal = new Set(["completed", "failed", "cancelled"] as const);

export function applyTaskEvent(state: TaskSnapshot, event: TaskEvent): TaskSnapshot {
  // 丢弃其他任务、旧一次运行、重复事件和过期事件。
  if (event.taskId !== state.taskId || event.runId !== state.runId) return state;
  if (event.sequence <= state.lastSequence) return state;
  // 如果序号不连续，应先拉取缺失事件或完整快照，而不能直接跳过。
  if (event.sequence !== state.lastSequence + 1) return state;
  if (terminal.has(state.status as "completed" | "failed" | "cancelled")) return state;

  const next = { ...state, lastSequence: event.sequence };
  if (event.type === "delta") next.content += String(event.payload);
  if (event.type === "completed") next.status = "completed";
  if (event.type === "failed") next.status = "failed";
  if (event.type === "cancelled") next.status = "cancelled";
  return next;
}
// 仅演示前端显示一致性；服务端仍须执行真实取消与授权。
