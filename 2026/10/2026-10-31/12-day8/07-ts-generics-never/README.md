# 第 8 天 · 第 7 题：TypeScript unknown、泛型、联合类型与 never

**评分：52/100**

## 1. unknown、any 与类型守卫

unknown 类型在收窄前不允许访问 data.name；any 绕过此类类型检查，可能隐藏运行时错误。对于不可信 JSON，优先使用 unknown 并验证。

```ts
interface User { name: string; age: number }
function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) return false;
  if (!("name" in value) || !("age" in value)) return false;
  return typeof value.name === "string" && typeof value.age === "number";
}
```

`value is User` 是类型谓词。类型谓词是否真实验证输入需要由开发者保证；number 类型检查也会接受 NaN，业务要求有限数值时可增加 Number.isFinite。

## 2. keyof、索引访问类型、类型推导

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = {name:"Tom",age:20};
const a = getProperty(user,"name"); // string，值 "Tom"
const b = getProperty(user,"age");  // number，值 20
// getProperty(user,"email"); // 类型错误
```

keyof T 是属性名联合类型，T[K] 是对应属性值的类型。ReturnType<F> 则用于获取函数类型 F 的返回值类型，不能替代 T[K]。通常对象字面量的属性类型会被拓宽成 string/number；`as const` 可保留 "Tom"/20 等字面量类型。

## 3. 可辨识联合与 never 穷尽性检查

```ts
type Loading = { status:"loading" };
type Success = { status:"success"; data:string[] };
type ErrorState = { status:"error"; error:Error };
type RequestState = Loading | Success | ErrorState;
```

status 是判别字段，这叫 Discriminated Union（可辨识联合类型）。检查 state.status==="success" 后，编译器把 state 收窄成 Success，允许访问 data。

never 表示不可能出现的值，可以检查 switch 是否覆盖所有联合成员：

```ts
function handleState(state: RequestState): string {
  switch(state.status) {
    case "loading": return "Loading";
    case "success": return state.data.join(",");
    case "error": return state.error.message;
    default: {
      const exhaustiveCheck: never = state;
      return exhaustiveCheck;
    }
  }
}
```

当 RequestState 增加 `{status:"cancelled"}` 时，default 分支中的 state 不再是 never，而是 Cancelled，赋值检查报错，提醒补充 case。

## 评分

| 项目 | 得分 |
|---|---:|
| unknown/any | 15/15 |
| 类型守卫 | 0/15 |
| keyof | 8/10 |
| T[K] 与返回类型 | 5/15 |
| 推导类型 | 6/10 |
| 可辨识联合与收窄 | 7/10 |
| never | 5/5 |
| 穷尽性检查 | 6/20 |
| **总分** | **52/100** |

[原始回答](./answer.md)
