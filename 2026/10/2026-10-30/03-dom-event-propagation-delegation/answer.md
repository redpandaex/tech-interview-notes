# 第 6 天 · 第 3 题：原始回答与评分

评分：62/100

## 用户原始回答（逐字保留）

这个引用计数看着像rust的智能指针,貌似rust也是通过弱引用来解决循环引用的



1. 默认应该是

out capture

inner capture

button

inner bubble

outer bubble

事件冒泡就是



2. preventDefault是阻止默认事件,stopPropagation是阻止冒泡事件的进一步传播(但他本身的冒泡事件还是会被保留吗?),stopImmediatePropagation是阻止监听某一个元素上的所有监听器的冒泡事件的传播
3. 事件委托就是弄一个大元素去判断,而不是监听所有的button元素,然后根据这个大元素的currentTargat去判断吧

react的onclick貌似是自定义的,忘记有啥区别了,忘记了

## 评价

- 事件传播顺序正确，但未完整解释捕获、目标和冒泡阶段。
- preventDefault 正确；stopPropagation 不仅针对冒泡，且不会阻止当前节点后续监听器；stopImmediatePropagation 会阻止当前节点后续监听器。
- 事件委托核心理解正确，但用于识别点击目标的是 target，而不是 currentTarget。
- React 使用 SyntheticEvent，React 17 起主要将事件委托到根容器，而不是 document。

[完整参考答案](./README.md)
