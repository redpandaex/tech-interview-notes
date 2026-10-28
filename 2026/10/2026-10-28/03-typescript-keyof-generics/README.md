# 第 5 天 · 第 3 题：TypeScript 泛型、keyof 与索引访问类型

**日期：** 2026-10-28
**评分：78/100**

## 题目

```ts
interface User {
  id: number;
  name: string;
  age: number;
  active: boolean;
}

function getProperty(obj: any, key: string): any {
  return obj[key];
}

const user: User = {
  id: 1,
  name: "Alice",
  age: 25,
  active: true,
};

const name = getProperty(user, "name");
const email = getProperty(user, "email");
```

1. 类型安全问题？为何 `email` 没报错？
2. 使用泛型、`keyof`、索引访问类型改造 `getProperty`，推导返回值类型。
3. `keyof User` 与 `User[keyof User]` 分别表示什么？

## 参考答案

### 1. any 与 string 的问题

`obj: any` 不检查属性存在性，`key: string` 允许任意字符串，返回值 `any` 失去类型信息，可能允许 `getProperty(user, "name").toFixed(2)` 等运行时错误。用 `unknown` 代替 `any` 更安全，但不能在未收窄时直接 `obj[key]`；本题需要泛型建立对象类型与属性名、返回值之间的关联。

### 2. 正确实现

```ts
function getProperty<T, K extends keyof T>(
  obj: T,
  key: K
): T[K] {
  return obj[key];
}

const name = getProperty(user, "name"); // string
const age = getProperty(user, "age"); // number
const active = getProperty(user, "active"); // boolean
getProperty(user, "email"); // 编译错误
```

`T` 表示对象类型；`K extends keyof T` 约束 K 是 T 的合法属性名；`T[K]` 是属性 K 对应的类型。注意 `extends` 约束要放在泛型声明中，不能写成函数参数的 `key: K extends keyof T`。

### 3. keyof 与索引访问

```ts
type UserKeys = keyof User;
// "id" | "name" | "age" | "active"

type UserName = User["name"];
// string

type UserValues = User[keyof User];
// string | number | boolean
```

`keyof T` 得到**属性名联合**，`T[K]` 得到**对应属性值的类型**，`T[keyof T]` 得到**所有属性值类型的联合**。这是编译期类型操作，不是运行时 `Object.keys()`。

## 评分

| 维度 | 得分 |
|---|---:|
| 类型安全问题 | 27/30 |
| 泛型函数实现 | 24/40 |
| keyof 与索引访问类型 | 27/30 |
| **合计** | **78/100** |

主要问题：泛型约束语法错误，函数体未实现；把属性名 `active` 写成 `boolean`。原始回答见 [answer.md](./answer.md)。
