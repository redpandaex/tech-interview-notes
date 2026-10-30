# 第 7 天 · 第 5 题：TypeScript 类型兼容、unknown 与 MyPick

**评分：76/100**

## 问题 1：类型兼容

```ts
interface User { id: number; name: string }
interface Admin { id: number; name: string; permissions: string[] }
declare const admin: Admin;
const user: User = admin; // 可以通过
```

**TypeScript 主要使用结构类型（Structural Typing）**：只要 Admin 有 User 需要的字段及兼容类型，就允许赋值；额外字段不会阻止普通结构赋值。但反方向缺失 permissions 不行。

**额外属性检查**：直接给 User 赋一个新鲜对象字面量，且字面量带了未声明的 permissions，通常报错；先赋值给变量、再按结构兼容性赋值则可通过。

```ts
const bad: User = { id: 1, name: "Tom", permissions: ["read"] }; // 报错
const obj = { id: 1, name: "Tom", permissions: ["read"] };
const good: User = obj; // 可通过
```

**interface vs type**：两者都可以表达对象契约；interface 支持 extends 和声明合并；type 可表达联合类型、元组、条件类型、映射类型等，也可以通过交叉类型扩展对象。TS 有 private/protected 类成员等特殊兼容性规则，因此并非所有类型判断都仅依赖公开属性。

## 问题 2：unknown、any、never

`unknown` 表示尚未得到足够类型信息；读取属性之前须收窄。与允许绕过多数静态检查的 `any` 不同：

```ts
function parseJSON(input: string): unknown { return JSON.parse(input); }
const data = parseJSON('{"name":"Tom"}');
// data.name;  // 错误
// data?.name; // 仍然错误，可选链只处理 null/undefined，无法证明有 name 属性

if (
  typeof data === "object" &&
  data !== null &&
  "name" in data &&
  typeof data.name === "string"
) {
  console.log(data.name);
}
```

`never` 是不可能存在的值的类型，可用于始终抛错的函数、switch 穷尽性检查：

```ts
type Status = "idle" | "loading";
function formatStatus(s: Status) {
  switch (s) {
    case "idle": return "等待";
    case "loading": return "加载";
    default: {
      const impossible: never = s;
      return impossible;
    }
  }
}
```

## 问题 3：MyPick

用户实现完全正确：

```ts
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

- `keyof T`：提取 T 的属性键联合类型。
- `K extends keyof T`：约束泛型 K 必须能够赋值给 T 的键类型。
- `T[P]`：索引访问类型，取得 T 的属性 P 对应的类型。
- `[P in K]`：映射类型，遍历键联合类型生成字段；标准写法还保留可选和 readonly 修饰符。

## 评分明细

| 考察项 | 得分 |
|---|---:|
| 类型兼容性、结构类型、额外属性检查 | 12/25 |
| interface 与 type | 12/15 |
| unknown、any、类型收窄 | 13/20 |
| never | 9/10 |
| MyPick 与类型运算 | 30/30 |
| **合计** | **76/100** |

[用户原始回答](./answer.md)
