# 第 7 天 · 第 5 题：用户原始回答与评分

**评分：76/100**

## 用户原始回答（逐字保留，保留原编号与顺序）

1. 不能,因为admin和这个不兼容吧
2. 不知道,
3. 一定报错吧,多了一个permission属性
4. interface一般是不能表示值类型,type是类型别名可以用来表示元组联合类型等,interface可以被extends来扩展,但是type的话一般是用交叉类型来扩展
5. 不能,没有声明data里面有name
6. unknown表示的是未知类型,变量在使用时游客能需要进行类型判定或者说类型收缩,但是any表示的是任意类型
7. 加一个问号data?.name
8. never表示一个绝对到达不了的类型,比如说在switch case里面,default分支就可以用这个

9.type MyPick\<T, K extends keyof T> = {\
&#x9;[P in K]: T[P];\
};

10. 提取T中属性出来作为一个联合类型
11. K属于这个keyof T提取出来的联合类型的一类
12. 表示P这个属性对应的类型

## 点评

结构兼容判断错误；TypeScript 默认是结构类型系统。对象字面量触发额外属性检查。可选链 data?.name 无法将 unknown 收窄。interface、type、unknown 与 any、never 的主要方向正确。MyPick 与三个类型操作符回答准确。

[参考答案](./README.md)
