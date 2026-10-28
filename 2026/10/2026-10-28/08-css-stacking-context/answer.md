# 第 5 天 · 第 8 题：用户原始回答与评价

**评分：75/100**

## 原始回答（逐字保留）

> 1. 因为这个z-index是一个相对的,它是在relaitve这个容器里面执行这个外面的container的z-index比header小,所以才会导致这个原因
> 2. 就是一个流式布局?具体概念我完全忘记了,比如visible?display:flex?
> 3. 把这个modal挂载在body上,设置其z-index为9999,也可以使用Portal来挂载

## 逐项评价

- **30/35**：正确理解 modal 受父级 container 的 z-index 层级限制。更准确的解释是 container 与 header 分别创建层叠上下文，根层叠上下文中 1 < 10；仅 position:relative 不一定创建层叠上下文。
- **15/35**：层叠上下文不是流式布局；visibility:visible、display:flex 本身不创建。常见创建条件有定位且非 auto 的 z-index、fixed、sticky、opacity<1、transform、filter、isolation 等。
- **30/30**：Portal 挂载到 body 下是正确方案；需注意 Portal 改变 DOM 位置但不改变 React 树，且普通 z-index 不能压过浏览器 Top Layer。

完整参考答案见 [README.md](./README.md)。
