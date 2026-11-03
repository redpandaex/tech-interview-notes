# 第 11 天 · 第 6 题：回答记录

**评分：60/100**

## 用户原始回答

> 1. 因为modal的z-index是基于container的
> 2. overflow:hidden吧

## 反馈

第一问方向正确：container 创建层叠上下文，modal 的 z-index 无法超越父级与 header 的层级比较。第二问不正确：overflow:hidden 是裁剪行为，不改变层叠顺序。可使用 React Portal、调整 container 的 z-index 或移除不必要的父级层叠上下文。

完整解析见 [README.md](./README.md)。
