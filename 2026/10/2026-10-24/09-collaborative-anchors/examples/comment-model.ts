export type CommentStatus = "active" | "orphaned" | "resolved";
export interface CommentAnchor {
  paragraphId: string;
  from: number;
  to: number;
  quote: string;
  contextBefore?: string;
  contextAfter?: string;
}
export interface Comment {
  id: string;
  content: string;
  status: CommentStatus;
  anchor?: CommentAnchor;
}
export function markAnchorOrphaned(comment: Comment): Comment {
  return { ...comment, status: "orphaned", anchor: undefined };
}
// 实际系统可以保留最后已知的 anchor 快照，供审计和手工重定位。
