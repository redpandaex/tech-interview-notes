# Day 1 · 第 9 题：ProseMirror + Yjs 协同编辑评论锚点

## 场景
用户 A 对第 20～30 字符添加评论，B 在前方插入字符，随后撤销导致评论位置偏移。如何映射位置、处理并发、恢复失效锚点？

## 标准答案

- 纯字符 offset 无法长期稳定标识富文本范围：插入、删除、节点拆分和合并都会影响位置；ProseMirror Position 还是文档树内的位置，并不总等于纯文本字符索引。
- ProseMirror `Transaction.mapping` 由 StepMap 组成，可把更新前的位置映射到更新后。使用 `mapping.map(pos, assoc)` 时要考虑边界插入的偏向、删除区间等语义。
- Mapping 适合在已知事务链中追踪位置，不是永久有效的跨会话 ID。Yjs RelativePosition、稳定段落 ID 或其他持久锚点可用于协同场景。
- Yjs 是 CRDT 方案，利用内部结构和并发合并规则让多个副本最终收敛；OT 通过转换并发操作保证一致。两者都不能自动保证合并后的业务语义正确。
- 恢复定位顺序：优先使用稳定锚点与映射；其次段落 ID + 相对偏移；最后在附近结合 quote 和上下文回退；若不可靠则标记锚点丢失，避免错误附着。
- 源内容被删除后，不应仅因锚点失效就默认删除评论数据。可保留评论并设置 `orphaned` 状态，具体清理策略按产品业务需求决定。

## 追问
段落：`React 很强大，React 很灵活，React 很流行。` 第二个 React 被删除，又出现一个新的 React。仅凭 paragraphId + quote 搜索会把评论错误挂到其他词上，因此需区分评论数据和评论位置。

## 示例
- [examples/map-comment.ts](examples/map-comment.ts)
- [examples/comment-model.ts](examples/comment-model.ts)

## 参考
- https://prosemirror.net/docs/ref/#transform.Mapping
- https://docs.yjs.dev/api/relative-positions
