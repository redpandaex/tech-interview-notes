# 第 9 天 · 第 5 题：CSS Flexbox 收缩与最小尺寸

**评分：45/100**

## 问题

500px 宽的 flex 容器，左侧 width:200px，右侧 flex:1；为何内容过长时左侧可能被压缩或布局溢出？如何让左侧固定 200px，右侧填满剩余空间并允许长文本换行？

## 原理

- flex item 默认 `flex-shrink:1`，所以仅设置 `width:200px` 并不能保证绝不收缩。
- 右侧 `flex:1` 通常展开为 `flex:1 1 0%`；它的自动最小尺寸 `min-width:auto` 可能由内容的最小内容宽度约束，特别是长的不可断行字符串。
- 当右侧不能缩到剩余宽度时，左侧可能承担收缩；若最小尺寸之和仍超出容器，布局可能溢出。
- 普通中文文本往往可以自动换行，不保证一定触发该问题。

## 推荐实现

```css
.container {
  display: flex;
  width: 500px;
}
.left {
  flex: 0 0 200px;
}
.right {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
```

- `flex:0 0 200px` 使左侧不增长、不收缩、基础尺寸 200px。
- `min-width:0` 允许右侧缩到比内容固有最小宽度更窄。
- `overflow-wrap:anywhere` 允许长字符串必要时断行。
- 单独给左侧设置 `min-width:200px` 能阻止它缩到 200px 以下，但不一定解决右侧溢出。

[原始回答](./answer.md)
