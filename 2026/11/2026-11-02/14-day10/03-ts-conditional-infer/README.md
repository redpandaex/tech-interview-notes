# Day 10 · Q3 — TypeScript 条件类型、infer 与分布式条件类型（85/100）

## 题目

```ts
type ElementType<T> =
  T extends Array<infer U> ? U : T;

type ElementTypeStrict<T> =
  [T] extends [Array<infer U>] ? U : T;

type A = ElementType<string[] | number>;
type B = ElementTypeStrict<string[] | number>;
type C = ElementType<string[] | number[]>;
type D = ElementTypeStrict<string[] | number[]>;
```

分别求 A/B/C/D，解释为什么 `[T]` 改变行为。

## 参考答案

| 类型 | 最终类型 | 原因 |
| --- | --- | --- |
| A | `string \| number` | 分发：`string[]` 提取为 `string`，`number` 原样保留 |
| B | `string[] \| number` | 不分发；整个联合类型并非数组，走 false 分支 |
| C | `string \| number` | 分发；两个数组分别提取元素类型 |
| D | `string \| number` | 不分发，但整个联合类型都可赋给数组；推断元素类型为联合类型 |

## 为什么裸类型参数会分发？

当条件类型的检查位置是裸类型参数 `T` 时：

```ts
type Distribute<T> = T extends Array<infer U> ? U : T;
```

传入 `X | Y` 会分别检查 `X` 和 `Y`，再将结果合并：

```ts
Distribute<string[] | number>
// Distribute<string[]> | Distribute<number>
// string | number
```

用方括号包装：

```ts
type NoDistribute<T> = [T] extends [Array<infer U>] ? U : T;
```

检查的是整个 `[T]`，不再按联合成员分发。这里的方括号创建的是**元组类型**，不是数组索引访问。

## infer 的作用

`infer U` 在条件类型的 true 分支中引入待推断的类型变量。例如：

```ts
type ArrayElement<T> = T extends (infer U)[] ? U : never;

type X = ArrayElement<Promise<string>[]>; // Promise<string>
type Y = ArrayElement<string[]>;          // string
```

## 追问：never 的边界

```ts
type E = ElementType<never>;       // never
type F = ElementTypeStrict<never>; // unknown
```

**E 为什么是 never？** `never` 是空联合类型。分布式条件类型对联合成员逐个处理；没有成员就没有分支可处理，结果为 `never`。

**F 为什么是 unknown？** `[T]` 阻止分发，实际检查 `[never] extends [Array<infer U>]`。由于 `never` 可赋值给任意类型，条件成立；但 `never` 无法提供具体元素类型供 `U` 推断，所以此处 `U` 为 `unknown`（已用 TypeScript 编译器验证）。

注意 `never | never` 本身会简化为 `never`，但不是 F 的结果。

## 对比示例

```ts
type A<T> = T extends string ? 1 : 2;
type B<T> = [T] extends [string] ? 1 : 2;

type X = A<never>; // never（空联合的分发）
type Y = B<never>; // 1（不分发，never 可赋值给 string）
```

## 相关误区

1. `[T]` 并不是让 `infer` 失效，只是阻止条件类型的联合分发。
2. 不分发不代表不能从联合数组推断元素类型：`string[] | number[]` 整体仍满足数组约束。
3. `unknown` 与 `never` 含义相反：前者是未知值，后者没有任何可能值。
4. 分布式条件类型需要**裸类型参数**处于 `extends` 左侧，并非所有带联合类型的条件判断都会分发。

## 评分

**85/100**：A/B/C/D 答对 3 项，正确理解分发与整体检查；追问 E 正确、F 错误。需巩固 `never` 与 `infer` 的特殊行为。