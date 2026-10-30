# 专题四：HTTP/1.1、HTTP/2、HTTP/3 与首屏性能优化

> 第 6 天面试复习 · 对应第 10 题（49/100）  
> 学习目标：从连接复用、Stream、Frame、TCP 队头阻塞与 QUIC 理解协议演进，并转化为工程优化策略。

## 1. 首先区分两个概念

**连接复用（Keep-Alive / Persistent Connection）**：同一个连接先后发送多个请求。

**多路复用（Multiplexing）**：同一个连接中多个请求/响应的数据可以交错传输。

HTTP/1.1 默认支持持久连接，但不支持 HTTP/2 式的多路复用。

```text
HTTP/1.1（典型单连接）：
连接 A：请求1 → 响应1 → 请求2 → 响应2

HTTP/2：
连接 A：请求1、请求2、请求3 的帧交错传输
```

HTTP/1.1 定义过 Pipelining（流水线），可连续发送请求，但响应仍需按顺序返回，未被浏览器广泛采用。

## 2. HTTP/1.1 的队头阻塞（HOL Blocking）

假设请求：

```text
A：大图片（慢）
B：小 JS（快）
C：小 CSS（快）
```

在常见的单连接请求模式中，B/C 可能排队等待 A 的响应。这是 HTTP 层的队头阻塞。

浏览器因此通常会为同一来源建立多个 HTTP/1.1 TCP 连接以增加并发。常见并发连接数约为 6，但不是协议固定值。多个连接会增加握手、内存和拥塞控制开销。

## 3. HTTP/2：Connection、Stream、Frame

```text
一个 TCP Connection
  ├── Stream 1：HTML
  ├── Stream 3：JS
  ├── Stream 5：CSS
  └── Stream 7：图片
```

HTTP/2 将消息拆成二进制 **Frame**，帧携带 Stream 标识，可在同一 TCP 连接中交错发送：

```text
[A1] [B1] [C1] [A2] [B2] [C2]
```

接收方按 Stream 归类数据。因此不必等完整的 A 响应传输完毕再传 B。

HTTP/2 还使用 **HPACK** 压缩 HTTP 头部。

## 4. 为什么 HTTP/2 仍有队头阻塞？

关键在于：**HTTP/2 的多个 Stream 共享同一个 TCP 有序字节流。**

TCP 必须按顺序向上层交付字节。如果中间某段数据丢失：

```text
TCP 数据段： [1] [丢失的2] [3] [4]
```

即使 3、4 到达，也需要等待 2 重传后才能作为连续的 TCP 字节流交付给 HTTP/2。由于多个 HTTP/2 Stream 的帧混在这个字节流中，一个丢包可能阻塞多个 Stream。

**结论：HTTP/2 缓解 HTTP 层 HOL，但没有消除 TCP 层 HOL。**

## 5. HTTP/3：QUIC 为什么基于 UDP？

QUIC 在 UDP 之上实现：

- 可靠传输与丢包恢复。
- 加密（集成 TLS 1.3）。
- 多路复用与独立 Stream 的有序交付。
- 拥塞控制。
- 在适当条件下支持连接迁移、0-RTT 恢复等能力。

```text
HTTP/2：
Stream A ─┐
Stream B ─┼→ 一个 TCP 有序字节流
Stream C ─┘

HTTP/3：
Stream A → QUIC Stream A ─┐
Stream B → QUIC Stream B ─┼→ QUIC / UDP
Stream C → QUIC Stream C ─┘
```

假设 A 的数据丢失，A 需要等待重传，但 **B、C 的有序数据交付不必因此阻塞**。

注意：不同 QUIC Stream 仍共享连接拥塞控制和带宽，丢包可能影响整体吞吐量；QUIC 并不是“丢包完全没影响”。

## 6. 三代协议速查表

| 维度 | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| 传输层 | TCP | TCP | QUIC（基于 UDP） |
| 持久连接 | 支持 | 支持 | 支持 |
| 多路复用 | 无 HTTP/2 式多路复用 | Stream + Frame | QUIC Stream |
| HTTP 层 HOL | 常见 | 大幅改善 | 大幅改善 |
| TCP 层 HOL | 有 | 有 | 不使用 TCP |
| 头部压缩 | 无专门机制 | HPACK | QPACK |

## 7. HTTP/2 时代，是否还要合并 JS/CSS、使用雪碧图？

HTTP/1.1 时代：合并资源能减少连接排队、请求开销。

HTTP/2 时代：大量小请求的传输成本下降，因此**不必为了减少请求数而激进地合并所有文件**。

但仍需权衡：

- 文件过小：请求与模块调度也有开销。
- 文件过大：首屏下载、解析、执行成本高。
- 缓存粒度：大 Bundle 改一点就可能导致整个文件缓存失效。
- 压缩效率：适当合并可能提高压缩效果。
- 依赖关系：拆包不合理可能产生请求瀑布。

雪碧图仍可能适合固定小图标场景，但不再是默认首选；SVG Sprite、图标组件、现代图片格式等也可考虑。

## 8. React 项目首屏优化：按瓶颈分类

### A. 网络传输

- CDN：减少资源访问延迟。
- Brotli/Gzip：减少传输体积。
- 强缓存：带哈希静态资源配置长期缓存；HTML 需合理更新策略。
- 图片：WebP/AVIF、响应式尺寸、压缩、按需加载。

### B. 资源加载顺序

- 路由级动态 `import()` 与 `React.lazy()`。
- 非关键资源延迟加载，关键资源适度预加载。
- 避免串行请求瀑布；检查 Network Waterfall。

```tsx
import { lazy, Suspense } from 'react';

const Reports = lazy(() => import('./pages/Reports'));

export function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <Reports />
    </Suspense>
  );
}
```

### C. JavaScript 主线程成本

- Tree Shaking、移除无用依赖。
- 控制 Bundle 大小和拆包粒度。
- 减少初始化、解析、编译、执行成本。
- 避免长任务，必要时拆分计算工作。

### D. 渲染与体验

- 为图片预留尺寸，降低 CLS。
- 优化首屏最大内容元素的加载和渲染，改善 LCP。
- 降低长任务造成的交互延迟，改善 INP。
- 骨架屏改善**感知**，不一定改善真实加载指标。

**先测量再优化：** Chrome DevTools Network、Performance、Lighthouse；关注 LCP、INP、CLS 和真实用户数据。

## 9. 面试速答（90 秒）

> HTTP/1.1 默认支持持久连接，但单连接通常串行处理请求响应，容易发生队头阻塞，因此浏览器建立多个 TCP 连接提高并发。HTTP/2 在一个 TCP 连接上通过 Stream 和 Frame 实现多路复用，缓解 HTTP 层队头阻塞，但 TCP 有序交付导致丢包时仍可能阻塞所有 Stream。HTTP/3 基于 UDP 上的 QUIC，提供可靠传输和独立 Stream 的有序交付，使一个 Stream 的丢包不必阻塞其他 Stream。工程上，HTTP/2 降低了小请求成本，不应盲目合并所有 JS；应结合缓存、代码分割、资源优先级、图片优化及真实性能指标综合优化。

## 10. 自测题

1. HTTP/1.1 能复用 TCP 连接吗？能在一个连接上交错传输多个响应吗？
2. HTTP/2 的 Stream 与 Frame 分别是什么？
3. 为什么 HTTP/2 仍存在 TCP 层 HOL？
4. QUIC 的一个 Stream 丢包是否会阻塞其他 Stream 的数据交付？
5. 为什么 HTTP/2 不意味着应该拆出无限多个极小 JS 文件？

**参考：** RFC 9113（HTTP/2）、RFC 9114（HTTP/3）、RFC 9000（QUIC）、web.dev 网络性能指南。