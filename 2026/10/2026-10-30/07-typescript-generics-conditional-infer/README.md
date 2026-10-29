# 第 6 天第 7 题 TypeScript 泛型与 infer

得分：88/100

## 参考答案

泛型 T 是类型参数，支持复用类型结构和表达类型关系。

索引访问类型：

```ts
type Data = Result["data"]; // User
type Name = User["name"]; // string
```

条件类型使用 T extends U ? X : Y。infer 可以在 extends 模式中提取内部类型。

```ts
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type A = UnwrapPromise<Promise<string>>; // string
type B = UnwrapPromise<number>; // number
type C = UnwrapPromise<Promise<Promise<boolean>>>; // Promise<boolean>
```

只拆一层 Promise。内置 Awaited<T> 可以递归拆解。

用户 MyReturnType 实现正确：

```ts
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer P ? P : any;
```

也可选择 never 作为兜底。内置 ReturnType 的经典定义也使用 any。

提取函数参数：

```ts
type MyParameters<T extends (...args: any[]) => any> =
  T extends (...args: infer P) => any ? P : never;
```

## 评分

泛型与索引访问 22/30；条件类型与 infer 35/35；MyReturnType 31/35；合计 88/100。

[原始回答与点评](./answer.md)
