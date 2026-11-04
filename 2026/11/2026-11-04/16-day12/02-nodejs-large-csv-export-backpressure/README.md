# 第 12 天 · 第 2 题：Node.js 百万订单 CSV 导出与 Stream 背压

**考察：服务端 / Node.js / 数据库 / HTTP**  
**难度：L2（中高级业务实践）**  
**最终评分：72/100**

## 一、题目

原始接口：

```ts
app.get("/api/orders/export", async (req, res) => {
  const orders = await db.orders.findAll();

  const rows = orders.map((order) => {
    return `${order.id},${order.amount},${order.createdAt}`;
  });

  const csv = ["id,amount,createdAt", ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.send(csv);
});
```

某租户积累 100 万条订单，导出时 Node.js 内存飙升甚至 OOM，多个用户同时导出时响应缓慢。

**主问题：**
1. 为什么出现内存和性能问题？瓶颈是什么？
2. 如何从数据库读取、HTTP 响应两个环节优化？

**第一次追问：** 每次读取 1000 条，但持续执行 `csv += convertToCSV(orders)`，最后 `res.send(csv)`，是否解决 OOM？如何改？

**第二次追问：** 数据库读取快、客户端下载慢，HTTP 流式写入会发生什么？如何控制？

## 二、瓶颈分析

1. `findAll()` 一次性加载全部数据，ORM 实例、对象和字符串可能占用大量内存。
2. `map()` 创建中间数组，`join()` 生成完整字符串；数据转换会产生额外内存和 CPU 开销。
3. 大量同步 CSV 转换会长时间占用 Node.js 主线程，影响其他请求延迟。
4. 数据库查询本身可能耗时，缺乏索引、过滤、合理的批量查询时更明显。
5. 多人并发导出时，内存占用和数据库负载进一步放大。

**关键：** 分批从数据库读取并不自动意味着低内存。若仍把全部结果拼接成一个字符串，内存仍随总数据量增长。

## 三、方案 A：分批读取 + HTTP 流式下载

```text
DB 游标/分批查询
      ↓ 一批记录
CSV 转换
      ↓ 一个 chunk
HTTP Writable Stream (res.write)
      ↓
浏览器下载
      ↑
  背压：慢客户端要求上游暂停
```

### 最核心的背压 API

```ts
import { once } from "node:events";

for await (const orders of fetchOrdersInBatches()) {
  const csv = convertToCSV(orders);

  if (!res.write(csv)) {
    // Writable 缓冲达到背压阈值；暂停上游
    await once(res, "drain");
  }
}
res.end();
```

- `res.write()` 返回 `true`：当前缓冲情况允许继续写入。
- 返回 `false`：**应该停止继续写入**，等待 `drain` 再恢复。
- 返回 `false` **不代表阻塞 JS 线程**；如果忽略背压继续写，Node.js 仍可能缓存越来越多待发送数据。
- `drain` 表示缓冲下降到可继续写入的状态，**不代表客户端已收到所有数据**。
- 数据库读取也应可暂停（异步迭代器、游标或批次之间 await）；否则只是 HTTP 层等待，DB 层仍可能预加载大量数据。

### 更贴近生产环境的结构：pipeline

使用数据库游标或有界批次提供源数据，通过 Transform 转成 CSV，再通过 `pipeline` 写到 HTTP 响应。Node.js Stream 管线会自动传播背压和大部分流错误。

```ts
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

type Order = { id: string; amount: string; createdAt: Date };

// 伪代码：readOrdersWithCursor() 必须是惰性、可暂停的异步迭代器。
// 不应先 findAll() 后再 yield，否则依然会把所有数据加载到内存。
async function* readOrdersWithCursor(tenantId: string): AsyncGenerator<Order> {
  let lastId: string | null = null;

  while (true) {
    const rows: Order[] = await db.orders.findMany({
      where: {
        tenantId,
        ...(lastId ? { id: { gt: lastId } } : {}),
      },
      orderBy: { id: "asc" },
      take: 1000,
    });

    if (rows.length === 0) return;

    for (const row of rows) yield row;
    lastId = rows[rows.length - 1].id;
  }
}

// CSV 字段转义：包含双引号、逗号、换行时必须正确引用
function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

app.get("/api/orders/export", async (req, res, next) => {
  const tenantId = req.auth.tenantId; // 来自可信的认证上下文
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="orders.csv"');

  const source = Readable.from(readOrdersWithCursor(tenantId), {
    objectMode: true,
  });

  const toCsv = new Transform({
    writableObjectMode: true,
    transform(order: Order, _encoding, callback) {
      try {
        const line = [
          csvCell(order.id),
          csvCell(order.amount),
          csvCell(order.createdAt.toISOString()),
        ].join(",") + "\r\n";
        callback(null, line);
      } catch (error) {
        callback(error as Error);
      }
    },
  });

  try {
    res.write("id,amount,createdAt\r\n");
    await pipeline(source, toCsv, res);
  } catch (error) {
    // 响应已开始发送时不能再尝试返回普通 JSON 错误
    if (!res.headersSent) return next(error);
    // 记录错误；客户端可能收到不完整文件
  }
});
```

> 上述代码用于展示架构思路。真实实现需根据数据库 SDK 调整游标条件、类型、关闭资源方式；并在请求断开时取消数据库读取。若严格保证 CSV 导出快照一致性，还需考虑导出期间数据更新和事务隔离。电子表格打开 CSV 时还应评估公式注入（如字段以 `=`、`+`、`-`、`@` 开头）风险。

### 数据库分批读取的选择

- **游标/Keyset 分页**：如 `WHERE id > last_id ORDER BY id LIMIT 1000`，通常适合大数据量顺序遍历。
- **OFFSET 分页**：大 OFFSET 可能越来越慢，数据并发变动时也可能跳过或重复记录。
- **数据库驱动的 Cursor/Streaming API**：适合连续遍历，但要注意事务生命周期、连接占用和资源清理。
- **租户隔离**：每次查询都必须限制 `tenant_id`，不能依赖前端传参作为授权依据。

示意 SQL（每个子句解释）：

```sql
SELECT id, amount, created_at
-- 只取导出需要的列，减少 I/O 与内存开销
FROM orders
-- 订单数据来源
WHERE tenant_id = :tenant_id
  AND id > :last_id
-- 限制租户；只读取上次游标之后的记录
ORDER BY id ASC
-- 确保遍历顺序稳定
LIMIT 1000;
-- 每批最多读取 1000 行
```

理想情况下需配合 `(tenant_id, id)` 复合索引，具体由数据库执行计划验证。

## 四、方案 B：后台导出任务 + 增量写文件

适用于耗时很长、导出文件较大、用户无需一直保持连接的场景：

```text
POST /api/exports
   ↓ 返回 exportId
任务队列 / Worker（控制并发）
   ↓ 分批读取订单
   ↓ 追加写入同一个 CSV 文件或对象存储
   ↓ 记录任务状态与下载地址
GET /api/exports/{exportId}
   ↓
前端轮询或接收通知，完成后下载
```

**无需必然先生成多个小文件再合并。** 可以向一个文件持续追加写入；使用 `fs.createWriteStream()` 也必须遵守背压，或使用 `pipeline`。

任务队列可以使用适合业务规模的 Redis/BullMQ、数据库任务表或消息系统。Kafka 能承载任务事件，但不是 HTTP 流式背压的替代品。后台任务也需要考虑幂等、重试、任务状态、文件清理、并发限制、失败恢复、授权和下载链接有效期。

## 五、背压与任务积压的区别

| 维度 | HTTP Stream 背压 | 任务队列积压 |
|---|---|---|
| 单位 | 字节/数据块 | 任务/消息 |
| 问题 | 数据生成速度大于客户端消费速度 | 提交任务速度大于 Worker 处理速度 |
| 典型手段 | `write()` 返回值、`drain`、`pipeline` | 队列、消费者并发、重试、限流 |
| Kafka 是否直接解决 | 否 | 可用于任务/消息传递 |

## 六、边界情况

1. **客户端取消下载**：取消游标读取，释放数据库连接，避免继续做无用功。
2. **慢客户端**：遵守背压，避免无限缓冲。
3. **多租户与权限**：后端强制租户过滤，并校验导出权限。
4. **CSV 格式正确性**：逗号、换行、双引号的转义；电子表格公式注入风险。
5. **长时间导出**：反向代理超时、连接中断、断点续传需求可能推动改用后台任务。
6. **并发导出**：限流、Worker 并发上限、数据库连接池容量、资源配额。
7. **一致性**：导出期间新增/修改订单时，需要明确是快照还是尽力而为的结果。

## 七、面试回答模板

> 代码一次性 `findAll` 加载全部订单，又用 `map` 和 `join` 构造完整 CSV，导致内存随数据量增长，并增加主线程与数据库压力。我会使用游标或 Keyset 分页分批读取，边转换边通过 HTTP Stream 写出，并通过 `write()` 返回值与 `drain` 或 `pipeline` 实现背压。若导出耗时很长，则改成后台任务，由 Worker 限制并发，分批追加写入文件，完成后返回下载链接。还需要考虑租户隔离、取消下载、CSV 转义与任务失败恢复。

## 八、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 23/30 |
| 解决方案 | 30/40 |
| 原理理解 | 13/20 |
| 边界意识 | 6/10 |
| **总分** | **72/100** |

用户提出后台任务、分批处理、输出文件，方向正确；认识到内存中累积字符串的问题，并能联想到“积压/背压”。不足在于把 Kafka 任务缓冲与 HTTP 流级背压混淆。
