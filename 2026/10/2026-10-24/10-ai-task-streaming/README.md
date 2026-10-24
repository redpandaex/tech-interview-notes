# Day 1 · 第 10 题：10 万在线用户的 AI 任务进度系统

## 面试题

设计一个支持 10 万用户同时在线的 AI 内容生成系统：任务长达 1～10 分钟，前端实时展示进度、增量内容、终态；支持刷新/断线后恢复，以及取消任务。

## 参考方案

### 1. 通信选型
- AI 文本/进度主要从服务端推到客户端，SSE 通常简单适用；WebSocket 适合频繁双向数据交互。二者都是长连接，都消耗连接数、文件描述符与内存，不能简单认定 SSE 一定比 WebSocket 省资源。
- 创建、取消任务使用普通 HTTP 请求；SSE 只负责订阅事件。**断开 SSE 不等于取消 Agent 任务**。
- 通过无状态或低状态的 API/SSE 网关水平扩容。非阻塞 I/O 模型能让有限线程服务大量连接，但需按真实消息吞吐、TLS、FD、代理超时与内存压测容量。

### 2. 架构设计
1. API 创建任务、验证权限、分配 taskId、持久化 queued 状态，并使用可靠的任务投递机制。
2. Worker 消费任务并执行 LangGraph/生成流程，控制并发数和资源预算。
3. Worker 把关键进度、内容快照或增量事件写入可恢复的持久化位置，然后向事件分发总线发送通知。
4. SSE Gateway 根据 taskId 和用户授权路由、订阅或拉取事件，向客户端推送。
5. 任务最终完成、失败或取消时，以可信存储中的终态为准。大体积 HTML/附件可以存储在对象存储中，事件只推送增量、进度和引用。

可以选择 Redis Streams、Kafka 等持久化事件/任务机制；Redis Pub/Sub 只适合实时通知，单独依赖它无法恢复离线期间的事件。并不是所有系统必须同时部署 Kafka、Redis、MySQL。

### 3. 断线恢复
每个事件带 taskId、单调 sequence、事件类型及 payload。客户端保存最后已处理序号；恢复时先认证、拉取缺失事件或快照，再继续订阅。处理重复、乱序和历史与实时消息重叠。

### 4. 取消任务与迟到消息
取消请求持久化 cancel_requested；通知 Worker 协作式停止。Worker 在写入终态前根据原子状态转移确认任务仍可完成。客户端根据 taskId/runId/sequence 与终态过滤迟到更新。不能仅靠关闭 SSE 或在前端过滤来停止后台资源消耗。

## 代码
- [examples/task-protocol.ts](examples/task-protocol.ts) — 状态与事件协议
- [examples/event-reducer.ts](examples/event-reducer.ts) — 幂等处理重复/迟到事件

## 知识点
SSE vs WebSocket、水平扩容、任务队列、事件回放、状态机、取消语义、断线续传、对象存储与运行态解耦。

## 参考
- https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
- https://redis.io/docs/latest/develop/data-types/streams/
