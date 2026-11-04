# 第 12 天 · 第 3 题：原始回答与追问记录

**最终评分：86/100**

## 主问题：跨页选中状态和组件 API

用户初次回答（原文）：

> 2. 设置一个全局的selections,完整row可能会比较多
> 3. 设置yigecurentPageSelction和

用户补充（原文）：

> currentPageSelection是当前页面的选择,全局则是跨页的

反馈：全局选择使用 ID 集合；当前页选择应作为派生数据，避免维护两份独立可写状态。

## 第一次追问：通用 Table Props

用户回答（原文）：

> 1. 一个就是rowKey,handleSelection,selections,save

反馈：方向正确。建议设计 `rowKey`、`selectedRowKeys`、`onSelectionChange`，可选 `preserveSelectedRowKeys`。

## 第二次追问：第二页全选与取消全选

用户回答（原文）：

> 1. 全选的话,就把当前页面的id都加入到selectrions里面去,如果删除的话,还是先去检测当前页面有哪些,然后去除掉

反馈：正确。全选合并当前页 ID，取消全选仅移除当前页 ID；用新 Set 更新 React 状态。

## 评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 26/30 |
| 解决方案 | 35/40 |
| 原理理解 | 17/20 |
| 边界意识 | 8/10 |
| **总分** | **86/100** |

详细解析见 [README.md](./README.md)。
