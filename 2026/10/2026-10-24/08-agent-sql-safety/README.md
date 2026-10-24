# Day 1 · 第 8 题：LangGraph Agent SQL 纠错、业务口径与查询安全

## 题目
教学分析 Agent 生成的 SQL 可能语法错误、Schema 错误、统计口径错误或超时。如何实现自动纠错、业务准确性以及教师课程级数据权限？如何验证查询结果？

## 参考答案
1. 错误分类：解析/Schema 错误可把结构化错误反馈给模型并提供授权范围内的元数据；业务逻辑错误应依据业务指标规则核验；超时需要资源限额、执行计划分析及终止机制。限制最大尝试次数、总耗时和工具调用预算，相同错误重复发生时提前终止。
2. Skill 可向模型提供表关系、字段语义和指标定义，但 Prompt **不是安全与正确性边界**。对指标使用可维护的语义层、授权查询工具、参数化查询和确定性校验。
3. 在真正执行 SQL 的工具服务端验证已认证身份、租户/课程权限，不接受模型自己声明的授权范围。优先使用限定业务能力的查询工具；如允许自由 SQL，使用 SQL AST 解析、只读数据库账号、表/列白名单、行级权限、超时与成本限制。
4. 只允许 SELECT 或追加 LIMIT 并不足以阻止高成本 JOIN、排序、扫描或函数滥用。可用查询计划、连接并发配额、只读副本/分析库隔离。
5. 返回结果正确性必须结合业务指标规则、已知不变量、统计口径和 Golden Dataset。第二个 LLM 可帮助发现疑点，但不能证明结果正确；离线评测不能替代线上权限控制与数据校验。

## 教师权限场景
教师仅获课程 course_1001 权限。模型生成 `SELECT COUNT(DISTINCT student_id) FROM exam_results WHERE score < 60` 会查询全表的记录，应由服务端强制限定 course_id，而不是靠提示词提醒模型。

## 示例
- [examples/grade-query.ts](examples/grade-query.ts)：带身份范围的受控查询工具示意。
- [examples/retry-policy.ts](examples/retry-policy.ts)：有限重试与错误类别示意。

## 参考
- https://docs.langchain.com/oss/python/langgraph/overview
- https://owasp.org/www-project-top-10-for-large-language-model-applications/
