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

---

## 补充：Offset 与事务边界的时序

```mermaid
sequenceDiagram
 participant K as Kafka Partition
 participant C as Consumer
 participant D as MySQL
 K-->>C: 投递 Offset 102
 C->>D: BEGIN; 插入去重记录; 写入成绩
 D-->>C: COMMIT 成功
 Note over C: 此时 Consumer 崩溃
 Note over K: 尚未提交下一 Offset 103
 K-->>C: 重启后可能再次交付 Offset 102
 C->>D: 尝试相同 message_id
 D-->>C: 唯一键冲突（已处理）
 C->>K: 提交下一消费位置 103
```

### 核心规则
- Kafka 提交的是**下一条要消费的位置**，处理完 offset 102 通常提交 103（对于该分区）。
- 先 Offset 后 DB：DB 失败时可能丢业务效果。
- 先 DB 后 Offset：可能重复交付，但可通过业务幂等抑制重复写入。
- 数据库写入、去重记录应处在**同一个事务**里；如果第二步失败回滚，第一步也回滚。
- 重复键冲突只代表该**业务消息 ID**已经存在记录，不能把任意 SQL 错误视为消费成功。

### 幂等的两个方案
1. 去重表：唯一 `message_id`，同事务插入和执行业务写入。失败重试时要能识别重复与其他异常。
2. 状态机 CAS：`UPDATE task SET status='completed' WHERE id=? AND status='pending'`，通过影响行数判断状态转换是否生效，需区分不存在/已经完成/其他非法状态。

### 生产边界

| 风险 | 防护 |
|---|---|
| Kafka Rebalance 使分区重新分配 | 处理在途任务、消费线程与提交位置协调 |
| 重试消息乱序或过期 | 任务版本/提交批次编号和条件更新 |
| 消费失败反复重试 | 有界重试、死信队列、人工补偿 |
| 多消费者并发处理相同业务 ID | DB 唯一约束而非先 SELECT 后 INSERT |
| Kafka 的 EOS 被误解为数据库原子性 | Kafka 事务不自动包住 MySQL 事务 |

### 常见追问
为什么不先 `SELECT id` 再 `INSERT`？两次检查之间有并发竞态，两个消费者可同时观察到不存在；最终应由唯一约束或条件更新建立原子性。
