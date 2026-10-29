# 第 6 天 · 第 7 题：原始回答与评分

评分：88/100

## 用户原始回答（逐字保留）

1.1泛型,因为有些类型是动态的,不好确认,或者说复用这个类型模板
1.2Result[data]可以吗
1.3User.name

2.1 A=string;b是number,c是Promsie<boolean>,这个看起来像是去提取Promsie中的类型

3.1 type MyReturnType<T extends (...args: any) => any> = T extends (
	...args: any
) => infer P
	? P
	: any;

## 评价

- 泛型的复用理解正确；索引访问类型应为 Result["data"] 和 User["name"]。
- infer 的三项推断结果全部正确，尤其理解 C 只提取一层 Promise。
- MyReturnType 的实现正确，与内置 ReturnType 的经典定义接近。兜底 any 可按需求换为 never，但不是语法或语义错误。

[参考答案](./README.md)
