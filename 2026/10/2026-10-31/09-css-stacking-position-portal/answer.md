# 第 7 天 · 第 9 题：用户原始回答与评分

**评分：48/100**

## 用户原始回答（逐字保留）

1. B,B的z-index大于2
2. 祖先元素的限制,比如说child-a由于祖先元素A的z-index没有b高,所以没啥用
3. 根元素html,position:sticky或者fixed等等
4. 这个是控制着元素的深浅z轴空间的吧



1. 包含快是什么意思呢?没看懂
2. 是的,我记得应该是positive:relative就行了吧
3. sticky是达到某一个坐标以后才会去固定位置,fixed则是直接固定
4. 因为视口位置被隐藏了?



1. 因为menu是被card包裹起来的内容
2. 给menu设置一个最大高度和滚动条?
3. 他是将组件挂载到任意一个元素上吧
4. 使用absolute或者fixed?

## 评价

理解了层叠上下文中父级排序决定子级整体顺序，sticky/fixed 的大致差别。欠缺包含块、transform 对 fixed 的影响、overflow 与层叠的区别、Portal 保持 React 逻辑父子关系、浮层坐标计算。

[参考答案](./README.md)
