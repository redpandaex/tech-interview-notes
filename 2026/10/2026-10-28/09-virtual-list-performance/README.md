# 第 5 天 · 第 9 题：React 长列表与虚拟滚动

日期：2026-10-28
评分：65/100

## 题目

```tsx
interface Item { id: number; name: string; }
function List({ items }: { items: Item[] }) {
  return <div className="list">{items.map(item => (
    <div key={item.id} className="list-item">{item.name}</div>
  ))}</div>;
}
```

页面有 10,000 条数据，首次加载卡顿、滚动不流畅、更新慢。

1. 为什么一次性渲染 10,000 DOM 节点会有性能问题？分别从 React 和浏览器分析。
2. 虚拟列表是什么？如何将 10,000 条数据的实际 DOM 降至几十个？
3. 行高不固定有什么问题，如何解决？

## 参考答案

### 1. React 与浏览器开销

React 初次渲染需要执行组件、创建 React 元素、处理 Fiber 和协调工作，在提交阶段创建/插入真实 DOM。更新时也可能需要遍历大量子元素，但组件重新渲染不等于每个真实 DOM 节点都被修改。

浏览器方面，大量节点增加内存占用、样式计算（Style）、布局（Layout）、绘制（Paint）和合成（Composite）的潜在开销；具体性能取决于结构、样式及实际变更范围，不能简单理解为 10,000 个节点必然导致 10,000 次重排。

### 2. 固定高度虚拟列表

虚拟列表仅渲染可见区及缓冲区（overscan）的元素，通过占位容器保留完整滚动高度，通过绝对定位或 transform 把可见节点放在正确位置。

例如 10,000 条数据，每条 50px，容器 500px：

```ts
const itemHeight = 50;
const containerHeight = 500;
const scrollTop = 2000;
const startIndex = Math.floor(scrollTop / itemHeight); // 40
const visibleCount = Math.ceil(containerHeight / itemHeight); // 10
const endIndex = startIndex + visibleCount; // 50
const visibleItems = items.slice(startIndex, endIndex);
const totalHeight = items.length * itemHeight; // 500000
```

实际使用时增加 overscan，避免快速滚动时短暂空白。

```tsx
<div style={{ height: totalHeight, position: "relative" }}>
  <div style={{ position: "absolute", top: startIndex * itemHeight }}>
    {visibleItems.map(item => <div key={item.id}>{item.name}</div>)}
  </div>
</div>
```

### 3. 动态高度

不固定行高时，`Math.floor(scrollTop / itemHeight)` 不再可靠，可能造成可视索引错误、内容错位、白屏、滚动条跳动。

例如行高 [50,120,80,200]，对应起始偏移 [0,50,170,250]，scrollTop=200 应显示第 3 行（0 基索引 2），不能按统一 50px 推算。

解决方法：

1. 用估计行高进行初始渲染；
2. 通过 ResizeObserver 或 DOM 测量获得真实行高；
3. 缓存每项高度与前缀偏移，更新定位；
4. 大规模数据可使用前缀和、二分查找或适当的数据结构提高位置查找效率；
5. 当视口前方的项目高度变化时，对 scrollTop 做滚动锚定/补偿，避免视觉跳动；
6. 保留 overscan，使用成熟虚拟列表库降低实现成本。

## 评分

| 维度 | 得分 |
|---|---:|
| 大量 DOM 性能问题 | 25/35 |
| 虚拟列表原理 | 30/35 |
| 动态高度问题与解决方案 | 10/30 |
| **总分** | **65/100** |

用户原始回答与评价见 [answer.md](./answer.md)。
