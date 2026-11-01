# 第 9 天 · 第 2 题：TypeScript 泛型与映射类型

**评分：100/100**

## 题目
实现与内置 Pick 相同的 MyPick<T,K>，K 必须是 T 的属性名，并保留属性类型、readonly 和可选修饰符。

## 标准实现

```ts
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

- `keyof T` 获取属性名联合类型；`K extends keyof T` 限制选择范围。
- `[P in K]` 是映射类型，遍历 K 中的属性名。
- `T[P]` 是索引访问类型，获取对应属性类型。
- 对这种同态映射形式，原有 readonly 和可选修饰符会被保留。

```ts
interface User {
  readonly id: number;
  name?: string;
  age: number;
}
type Result = MyPick<User, "id" | "name">;
// { readonly id: number; name?: string }
// MyPick<User, "email"> 会产生类型错误。
```

[原始回答](./answer.md)
