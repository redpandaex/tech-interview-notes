# Day 1 · 第 7 题：Kafka 消费与 MySQL 业务幂等

## 面试题
Kafka 消费者写入 MySQL 成功后、Offset 提交前崩溃会怎样？如何保证业务幂等？反过来 Offset 成功、DB 失败又如何处理？

## 参考答案
- Kafka 分区内的消息按 Offset 持久存放，消费进度由消费者组提交的 Offset 决定。数据库已提交但 Offset 尚未提交时，恢复后可能再次消费；并不存在专门的“等待队列”。
- 使用业务唯一 ID（如 message_id/task_id + 业务版本）去重，而不是时间戳。
- **唯一约束 + 单库事务**：在一个 DB 事务内插入去重记录并修改业务数据；成功后再提交 Kafka Offset。如果重复消费，唯一键冲突可作为已处理信号（必须区分其他数据库异常）。
- **状态机条件更新**：通过状态约束与受影响行数识别重复执行，例如 PENDING → COMPLETED；任务不存在和已完成需另行区分。
- **Offset 先提交但 DB 后失败**：恢复时通常不会自动重新处理已提交位置的消息，可能造成业务遗漏。因此通常先 DB commit 再 Kafka commit，接受可能重复并通过幂等机制消除副作用。
- 以上获得业务层的可靠至少一次处理加幂等效果，并不意味着 Kafka/MySQL 自动形成分布式原子事务。

## 两个事务边界问题
1. 插入去重记录后业务 UPDATE 失败：如果同一事务回滚，去重插入也一起回滚。
2. DB COMMIT 成功但 Offset 提交失败：可能重试并出现重复键，识别已处理后安全提交消费进度。是同一条业务消息去重，不代表整个 Topic 被处理完。

## 代码
- [examples/schema.sql](examples/schema.sql)
- [examples/consumer.ts](examples/consumer.ts)：事务接口伪实现，非可直接连接数据库的程序。

## 参考
- https://kafka.apache.org/documentation/#semantics
