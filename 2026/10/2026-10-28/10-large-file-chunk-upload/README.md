# 第 5 天 · 第 10 题：5GB 大文件分片上传系统设计

日期：2026-10-28
评分：72/100

## 题目

设计支持 5GB 视频上传的前端组件：上传进度、暂停继续、断点续传、避免重复上传、不能明显卡顿。

1. 为什么不直接用一个 HTTP 请求上传 5GB？如何用 Blob.slice 分片？每片携带什么信息？
2. 如何实现暂停、继续、跨浏览器会话断点续传？
3. 如何实现文件秒传和多分片并发的准确整体进度？

## 参考答案

### 1. 分片上传

单次传输 5GB 并不必然造成 JS 内存溢出：直接将 File 放进 FormData，浏览器可通过底层机制处理，不需要先把整个文件读入 JS 内存。若调用 file.arrayBuffer() 读取完整文件，则可能产生严重内存压力。单请求主要问题是失败重传成本高、超时/网络波动、暂停恢复困难。

```ts
function createChunks(file: File, chunkSize = 5 * 1024 * 1024): Blob[] {
  const chunks: Blob[] = [];
  for (let start = 0; start < file.size; start += chunkSize) {
    chunks.push(file.slice(start, Math.min(start + chunkSize, file.size)));
  }
  return chunks;
}
```

可根据文件大小、网络与服务端限制调整分片大小。初始化任务时提交 fileName、fileSize、fileHash、chunkSize 等文件级信息；每片请求携带 uploadId、chunkIndex、chunk Blob，按需包含 chunkHash、totalChunks 等元数据。Blob.slice 不要求完整读取原文件到 JS 内存。

### 2. 暂停、继续、断点续传

- POST /uploads/init 建立任务并返回 uploadId。
- 服务端保存已**确认持久化**的分片索引，客户端查询上传状态并跳过已完成分片。
- 用 AbortController.abort() 取消进行中的 fetch；注意取消请求不保证服务端没有收到分片，恢复时以服务端确认为准。
- 限制并发（如 3–5），失败分片有限次重试、退避；分片上传接口需要幂等性。
- 跨浏览器会话恢复时重新选择文件并匹配原上传任务，或在授权与兼容性允许时使用 File System Access API 持久化文件句柄。普通网页不能假设重启后仍保有原 File 对象。
- 所有分片完成后服务端合并、校验完整性、持久化、标记任务完成。

### 3. 秒传、Hash、上传进度

秒传需要在上传前查询服务端是否已有相同内容且当前用户有权复用：客户端计算文件内容摘要（如 SHA-256）并提交 fileHash/fileSize，服务端判断是否可直接关联现有文件。合并完成后才计算 Hash 只能为后续上传提供去重信息，无法让当前上传直接秒传。服务端应验证实际文件完整性，不能无条件相信客户端 Hash；秒传查询须有权限控制。5GB Hash 计算可用 Web Worker + 分块读取 + 增量摘要避免主线程卡顿，但完整摘要仍需读取整个文件。

并发上传进度基于**字节数**，不需要 Hash 列表：

```ts
interface ChunkProgress {
  index: number;
  size: number;
  loaded: number; // 当前传输尝试已发送的字节
  completed: boolean; // 服务端已确认保存
}

const uploadedBytes = chunks.reduce(
  (total, chunk) => total + (chunk.completed ? chunk.size : chunk.loaded),
  0
);
const progress = uploadedBytes / file.size * 100;
```

失败重试时重置 loaded，避免重复累计。XHR 的 upload.onprogress 可用于分片上传进度；浏览器 fetch 通常没有直接对应的上传进度事件。区分“字节传输 100%”与“服务端合并校验完成”。

### 关键工程点

幂等分片写入、服务端持久化状态、并发限制、失败重试、最终完整性校验、任务过期清理、权限控制、上传进度与服务端处理进度区分。

## 评分

| 考察点 | 得分 |
|---|---:|
| 分片上传与动态策略 | 24/35 |
| 暂停与断点续传 | 26/35 |
| 秒传与进度 | 22/30 |
| **总分** | **72/100** |

原始回答与评价见 [answer.md](./answer.md)。
