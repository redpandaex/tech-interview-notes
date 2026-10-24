// TypeScript 示意：抽象 Kafka 消费和 MySQL 事务接口。
// 依赖实际消息客户端/DB ORM 后实现；本文件用于展示事务与 offset 顺序。
interface Message { id: string; taskId: number; score: number }
interface Tx {
  insertDedup(id: string): Promise<"inserted" | "duplicate">;
  updateGrade(taskId: number, score: number): Promise<void>;
}
interface Database {
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}
interface OffsetCommitter { commit(): Promise<void> }

export async function handleMessage(
  message: Message,
  db: Database,
  offsets: OffsetCommitter,
): Promise<void> {
  await db.transaction(async (tx) => {
    const status = await tx.insertDedup(message.id);
    if (status === "duplicate") return;
    await tx.updateGrade(message.taskId, message.score);
    // 注意：DB 事务失败时，去重插入也必须回滚。
  });
  // DB 成功后才提交 offset；若此步失败允许重复消费，由幂等去重。
  await offsets.commit();
}
