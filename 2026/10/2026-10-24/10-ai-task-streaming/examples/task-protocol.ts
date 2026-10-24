export type TaskStatus =
  | "queued"
  | "running"
  | "cancel_requested"
  | "completed"
  | "failed"
  | "cancelled";

export type TaskEventType = "progress" | "delta" | "completed" | "failed" | "cancelled";

export interface TaskEvent {
  taskId: string;
  runId: string;
  sequence: number;
  type: TaskEventType;
  payload: unknown;
}

export interface TaskSnapshot {
  taskId: string;
  runId: string;
  lastSequence: number;
  status: TaskStatus;
  content: string;
}

// 示例 REST：POST /api/tasks、GET /api/tasks/:id/events、POST /api/tasks/:id/cancel
// 事件序号由服务端持久化生成，不能信任客户端自行声明。
