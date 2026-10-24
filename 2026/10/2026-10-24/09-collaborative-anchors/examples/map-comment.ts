// 需要安装 prosemirror-state；这是编辑器事务处理中的示例函数。
import type { Transaction } from "prosemirror-state";

export interface Range { from: number; to: number }

export function mapCommentRange(tr: Transaction, old: Range): Range | null {
  const from = tr.mapping.mapResult(old.from, 1);
  const to = tr.mapping.mapResult(old.to, -1);
  // 被删除时是否保留/收缩区间，应根据业务规则决定。
  if (from.deleted && to.deleted) return null;
  if (from.pos >= to.pos) return null;
  return { from: from.pos, to: to.pos };
}
