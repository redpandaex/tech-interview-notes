# 第 6 天 · 第 8 题：原始回答与评分

评分：62/100

## 用户原始回答（逐字保留）

1. HTML解析,DOM解析,CSSOM解析, 静态资源加载,UI合成,layout->paint->compiste

2.1会触发重排和重绘

2.2 会触发重绘

2.3 不一定

transform不会触发布局的重新变更好像是



1. 不太清楚
2. 不清楚
3. 会导致大量重排或者重绘布局?
4. 不知道,尽量使用getComputedStryle去变更其他属性吗?

## 评价

- 渲染阶段顺序大致正确，但没有解释 DOM、CSSOM、Render Tree 的生成关系。
- width、backgroundColor、transform 的影响判断基本正确；需说明 transform 在合成优化条件下可能跳过布局和绘制。
- offsetWidth 可能强制同步布局；频繁读写交替造成布局抖动；应读写分离。getComputedStyle 是读取样式的 API，也可能触发计算。

[参考答案](./README.md)
