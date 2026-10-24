// TypeScript 业务工具示例：数据库执行接口由实际服务实现。
interface QueryContext {
  userId: string;
  allowedCourseIds: string[]; // 由服务端验证身份后取得，不能信任 LLM 提供
}
interface GradeQuery { courseId: string; maxScore: number }
interface Database {
  query<T>(sql: string, params: readonly unknown[]): Promise<T[]>;
}
export async function countLowScoringStudents(
  db: Database,
  ctx: QueryContext,
  input: GradeQuery,
): Promise<number> {
  if (!ctx.allowedCourseIds.includes(input.courseId)) {
    throw new Error("Permission denied");
  }
  const rows = await db.query<{ total: number }>(
    "SELECT COUNT(DISTINCT student_id) AS total FROM exam_results WHERE course_id = ? AND score < ?",
    [input.courseId, input.maxScore],
  );
  return rows[0]?.total ?? 0;
}
// 生产系统还要校验“低分人数”的指标口径、数据范围与其他租户边界。
