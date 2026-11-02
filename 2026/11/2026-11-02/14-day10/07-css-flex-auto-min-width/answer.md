# Day 10 · Q7 — 用户原始回答与评分

## 主问题

800px 的 Flex 两栏布局，侧栏固定 240px，内容栏 `flex: 1`，长文本设置单行省略号却撑大内容栏。问原因、修复方法，以及 `flex-shrink` 和 `min-width` 的关系。

### 用户回答

> 1. 没有设置固定或者最大宽度
>
> 1.1 没有设置换行
>
> 1.2 white-space:any
>
> flex:1拆分则是flex-grow flex-shrink flex-base,min-width:0
>
> 不知道

### 评价

- 知道 `flex: 1` 由增长、收缩、基准尺寸组成，方向正确；规范名称是 `flex-basis`。
- 不需要给右栏指定固定宽度；根本问题是 `min-width: auto` 对内容固有宽度的约束。
- 单行省略要求禁止换行；`white-space: any` 不是有效值。
- `min-width: 0` 是正确修复，但没有说明原因。

## 追问

将 `.content` 设置为 `overflow: hidden` 能否解决？为什么？与 `min-width: 0` 有何区别？

### 用户回答

> 1. 是的,隐藏吧

### 评价

- “可以解决”判断正确。
- 未解释 `overflow: hidden` 会改变自动最小主轴尺寸的计算，而不仅仅是隐藏视觉溢出。
- 未解释它会裁剪整个容器，与只解除宽度约束的 `min-width: 0` 有区别。

## 最终评分

**55/100**。参考答案、示例及工程取舍详见 [README.md](./README.md)。