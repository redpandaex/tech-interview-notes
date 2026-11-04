# 第 12 天 · 第 4 题：MySQL 慢 SQL、联合索引与 B+ 树

**方向：服务端 / MySQL 8.0 / 多租户 SaaS**  
**难度：L2**  
**最终评分：50/100**

## 一、题目

订单表约 500 万行：

```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  amount DECIMAL(10, 2) NOT NULL
);
```

订单列表查询：

```sql
SELECT *
FROM orders
WHERE tenant_id = 1001
  AND status = 'paid'
ORDER BY created_at DESC
LIMIT 20;
```

**主问题：**
1. 如何排查慢 SQL，如何判断索引是否有效？
2. 应该如何设计索引，为什么？

**追问一：** 有联合索引 `(tenant_id, status, created_at DESC)`，为什么带 `status='paid'` 的查询更容易直接利用索引排序，而只按租户筛选的查询不一定可以？

**追问二：** 若只查询租户最近 20 条订单，不再筛选状态，应建什么索引？

用户额外询问：联合索引是否为二叉树？为什么树形索引快？索引是否空间换时间，是否影响插入和更新？

## 二、排查慢 SQL：先看执行计划

```sql
EXPLAIN ANALYZE
SELECT *
FROM orders
WHERE tenant_id = 1001
  AND status = 'paid'
ORDER BY created_at DESC
LIMIT 20;
```

- **`EXPLAIN`**：查看优化器估算的执行计划。
- **`EXPLAIN ANALYZE`**：MySQL 8.0.18+ 可执行查询并报告实际耗时与行数；在生产环境使用时注意它会实际运行 SQL。

重点观察：

| 字段 | 意义 | 关注点 |
|---|---|---|
| `type` | 访问方式 | `ALL` 可能表示全表扫描 |
| `possible_keys` | 可能使用的索引 | 是否存在适用索引 |
| `key` | 实际选择的索引 | 是否与预期一致 |
| `rows` | 估计扫描行数 | 是否扫描过多 |
| `Extra` | 额外操作 | `Using filesort` 可能提示额外排序 |

注意：`Using filesort` 不一定慢，`type=ALL` 也不是绝对错误，需结合数据分布、执行耗时和实际扫描行数。

## 三、原 SQL 推荐的联合索引

```sql
CREATE INDEX idx_orders_tenant_status_created
-- 给索引命名，便于观察执行计划
ON orders (tenant_id, status, created_at DESC);
-- 先两个等值过滤条件，再放排序字段
```

索引键的字典序近似：

```text
tenant_id  status   created_at
1001       paid     2026-11-04
1001       paid     2026-11-02
1001       pending  2026-11-03
1001       pending  2026-11-01
1002       paid     2026-11-04
```

对 `tenant_id=1001 AND status='paid'`，索引中的目标记录在一个连续范围内，并且已按 `created_at DESC` 排序，可以顺序读取前 20 条。

**为何只筛选租户时可能无法直接满足排序？**

```sql
SELECT *
FROM orders
WHERE tenant_id = 1001
ORDER BY created_at DESC
LIMIT 20;
```

因为同一租户的索引记录先按 `status` 分组，每个状态组内才按时间排序。跨状态合并后并非全局时间顺序。优化器可能需要额外排序或选择其他索引。

## 四、需求变化：只按租户过滤、创建时间倒序

```sql
CREATE INDEX idx_orders_tenant_created
ON orders (tenant_id, created_at DESC);
```

- `tenant_id`：等值筛选租户。
- `created_at DESC`：在该租户范围内按时间倒序读取，配合 `LIMIT 20`。
- 若多个订单创建时间相同，生产环境可以使用 `ORDER BY created_at DESC, id DESC` 形成稳定排序，并评估相应索引设计。

**为什么不优先使用 `(tenant_id, id)`？** 因为 `id` 的顺序不保证等于 `created_at` 的顺序。即使自增 ID 与创建时间通常相关，也不能替代 SQL 中明确的排序语义。

InnoDB 二级索引叶子记录包含主键值作为定位聚簇索引记录的依据；因此，单独的 `tenant_id` 二级索引通常已携带主键值，但不能由此推导出 `created_at DESC` 的排序能力。

## 五、B+ 树不是二叉树

**普通二叉搜索树**：每个节点最多两个子节点；若不平衡可能退化。

**B+ 树**：一个内部节点可以有很多子节点；索引记录在叶子层有序组织，适合数据库按页访问、范围扫描与顺序读取。

```text
                     [ 根页：分隔键 ]
                    /       |       \
              [内部页]   [内部页]   [内部页]
               / | \       / | \       / | \
             [叶子页] → [叶子页] → [叶子页] → ...
```

该示意图只表示多叉和有序叶子层，不代表精确的页面布局。

**为什么快？**

1. 一个索引页容纳大量键与指针，扇出大，树高度通常低。
2. 定位目标范围需要访问的页面数较少。
3. 叶子层有序，适合范围扫描、排序、`LIMIT` 等操作。
4. 在索引覆盖所需字段时可避免回表；但原题 `SELECT *` 可能仍需根据二级索引中的主键回表获取 `amount` 等列。

### 联合索引是否有多棵树？

`(tenant_id, status, created_at)` 是**一棵 B+ 树，使用复合索引键排序**，不是为三个字段分别建三棵树。列顺序决定可高效定位的范围以及能否直接满足排序。

## 六、索引是空间换时间吗？

是，但更完整地说：**额外存储空间 + 写入维护成本，换取某些查询的更高效率。**

| 操作 | 影响 |
|---|---|
| `SELECT` | 可能减少扫描、排序、回表；不一定每条查询都变快 |
| `INSERT` | 需要为新记录维护相关索引 |
| `UPDATE` | 更新索引列时通常需要维护索引项 |
| `DELETE` | 需要维护相关索引记录 |
| 存储/缓存 | 索引占用磁盘空间与缓冲池 |

**不要误以为所有 UPDATE 都要重建所有索引。** 修改非索引字段时通常不需要更新该字段无关的二级索引项，但仍有事务日志、行修改等成本。

索引不是越多越好。创建后应通过 `EXPLAIN`、实际耗时、扫描行数与写入负载验证效果。

## 七、进阶边界：深分页

即使有 `(tenant_id, created_at DESC)`，如果查询：

```sql
SELECT *
FROM orders
WHERE tenant_id = 1001
ORDER BY created_at DESC, id DESC
LIMIT 100000, 20;
```

仍可能需要跳过大量索引记录。可考虑 **Keyset/Cursor 分页**：以前一页最后一条的 `(created_at, id)` 作为游标，配合稳定排序与合适索引。这里只作为扩展，不是本题必答。

## 八、面试简答模板

> 我会先用 EXPLAIN 或 EXPLAIN ANALYZE 看是否全表扫描、实际选择哪个索引、扫描多少行以及是否额外排序。原查询的两个等值条件是 tenant_id 和 status，排序字段是 created_at，因此优先考虑 (tenant_id, status, created_at DESC)。如果需求改为只筛选租户并按时间倒序，就改用 (tenant_id, created_at DESC)。InnoDB 的常规索引是 B+ 树，联合索引是一棵按复合键排序的树。索引提升读取效率，但占空间并增加写入维护成本。

## 九、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 15/30 |
| 解决方案 | 12/40 |
| 原理理解 | 16/20 |
| 边界意识 | 7/10 |
| **总分** | **50/100** |

用户暂时不熟悉执行计划与索引列顺序，连续提出 `(tenant_id, id)`，未命中 `created_at` 排序需求；但对索引空间换时间及写入维护成本提出了正确的概念性问题。建议先巩固 B+ 树复合键顺序、等值过滤与 ORDER BY 的关系，再学习 EXPLAIN。
