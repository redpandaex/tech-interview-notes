# TypeScript 泛型与类型安全事件总线 · 追问与答题记录

**状态：已回答主问题，第一轮追问待答**

## 用户原始回答（原文）

> 1. 让type为一个联合类型 Type A = "xxx"|"xxx"?
> 2. 设计枚举类型
> 3. off加一个destory函数类型,one可能是加一个标志位?

## 面试官第一轮追问（已提出，待回答）

给定：

```ts
interface Events {
  login: { userId: string; token: string };
  logout: { userId: string };
}
```

请补全：

```ts
type EventName = ???;
type EventPayload<K extends EventName> = ???;
```

提示：`keyof` 与索引访问类型 `T[K]`。用户答题前不提前公布答案。

## 面试官第二轮追问（如有）

待第一轮回答后决定；最多两轮。

## 点评与改进建议（初评）

**当前评价：45/100（非最终分）**

1. 手写字符串联合类型能约束事件名称，但需要同步维护；尚未利用 `keyof` 自动提取。
2. 枚举可以约束名称，但不能单独建立事件名称与载荷类型的关联。
3. `off` 应移除指定监听函数；`destroy` 一般清理整个实例，职责不同。
4. `once` 使用标志位有一定可行性，但需明确回调执行后的自动解绑。
5. 下一步重点：泛型约束、索引访问类型和事件名与载荷类型的对应关系。

> 待用户回答第一轮追问后补充实际作答、追问与最终评价。

## 第一轮追问后续交流

用户原话：

> 不记得了,这个应该是利用keyof去编辑生成联合类型?我刚刚有点没看懂你的题目其实

面试官解释：

- `keyof Events` 自动提取属性名组成联合类型；
- `Events["login"]` 是类型层面的索引访问；
- `type EventPayload<K extends keyof Events> = Events[K]` 建立事件名称与载荷类型关联；
- 原题需求表述偏跳跃，改用更基础的类型推导题检查理解。

**当前待回答的简化追问：**

```ts
interface User {
  id: number;
  name: string;
  active: boolean;
}

type A = keyof User;
type B = User["name"];
type C = User["id" | "active"];
```

请说出 A、B、C 的类型；暂不公布结果，等待用户回答。

## 简化追问：用户回答及点评

用户原话：

> A是联合类型 "id"|"name"|"active"
> b是string类型
> c是number|boolean

**评价：3/3，全部正确。** 用户正确理解 `keyof T`、`T[K]` 以及联合索引对应的联合属性类型。

## 第二轮追问（已提出，待回答）

```ts
interface Events {
  login: { userId: string; token: string };
  logout: { userId: string };
}
class EventBus {
  emit<K extends keyof Events>(event: K, payload: Events[K]) {}
}
const bus = new EventBus();
bus.emit("login", { userId: "1001", token: "abc" }); // A
bus.emit("login", { userId: "1001" }); // B
bus.emit("logout", { userId: "1001" }); // C
bus.emit("register", { userId: "1001" }); // D
```

1. 判断 A/B/C/D 哪些调用报类型错误及原因。
2. 解释泛型 `K` 关联事件名和载荷，与 `emit(event: keyof Events, payload: Events[keyof Events])` 的区别。

**状态：第二轮追问待答。暂不公布答案。**

## 第二轮追问：用户回答与最终点评

用户原话：

> D吧
> ,因为这个泛型类型不好确认?

正确结果：B、D 报错；B 的 login 缺少 token，D 的 register 不是合法事件名。A、C 正确。

泛型 K 的作用是关联事件名称与 payload 的类型，不是解决无法确定泛型的问题。独立使用 keyof Events 和 Events[keyof Events] 会丢失两参数关联。

最终评价：65/100。已完成两轮追问；后续重点复习泛型约束、类型关联及事件总线实现。
