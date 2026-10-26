# TypeScript 泛型与类型安全事件总线

> 日期：2026-10-26 · 第 3 天 · 题号 01 · 方向：JS/TS · 难度：★★★★☆

**状态：待作答**

## 题目背景

为 SaaS 平台设计通用事件总线，不同事件有不同参数结构。

## 代码/数据示例

```ts
interface Events {
  login: { userId: string; token: string };
  logout: { userId: string };
  orderCreated: { orderId: number; amount: number };
}

bus.on('login', payload => console.log(payload.userId));
bus.emit('login', { userId: '1001', token: 'abc' });
```

## 主问题

1. 如何使用泛型和 keyof 约束事件名和参数？
2. 如何让 emit('login', ...) 只能接受对应结构？
3. 如何实现 on、off、once？
4. TypeScript 的静态检查能保证运行时数据合法吗？
5. 如果允许业务模块扩展事件类型，如何设计？

## 作答与评审状态

- 用户原始回答：待作答
- 面试官点评：待作答
- 追问记录：待作答（每题最多 1～2 轮）
- 详细标准答案：**暂不公布，待用户作答后补充**

> 后续补充时保留真实回答，详细答案需覆盖原理、执行流程、方案对比、边界、错误示例、最佳实践、可执行代码、权威资料；架构类问题优先附 GitHub Mermaid 图。
