# 第 11 天 · 第 2 题：原始回答、追问与评分

**最终得分：55/100**

## 主问题

TypeScript `strict: true` 下，判断四次普通函数类型赋值：

1. `dogHandler = animalHandler`
2. `animalHandler = dogHandler`
3. `animalFactory = dogFactory`
4. `dogFactory = animalFactory`

### 用户原始回答

> 1. 非法
> 2. 合法
> 3. 非法
> 4. 合法
>
> 这个很难解释,具体例子就是一个大容器可以装小的东西和大东西,小容器只能装小东西
>
> 不知道

### 评价

四项判断均反向。正确顺序是：**合法、非法、合法、非法**。

- 函数参数逆变：能处理更宽泛输入的函数可以替代处理更具体输入的函数。
- 函数返回值协变：返回更具体类型的函数可以替代返回更宽泛类型的函数。

## 追问

```ts
const fn = (animal: Animal): Dog => ({
  name: animal.name,
  bark() {},
});

type Handler = (dog: Dog) => Animal;

const handler: Handler = fn;
```

### 用户原始回答

> 形参这里可以理解
>
> 参数多的兼容can塑小的,但是返回值那里不太能理解,一个原来只有{name:}的类型却可以接受返回一个{name:xxx,dark(){}}吗?
>
> 1. 非法吧

### 评价

追问正确答案是**合法**：

- 参数：`fn` 能接收 Animal，当然能接收 Dog。
- 返回：`fn` 保证返回 Dog，满足 Handler 对 Animal 的要求。

用户的疑问触及结构化类型的关键：Animal 类型要求 `name`，并不禁止运行时对象包含额外的 `bark` 方法。多余属性检查主要影响新鲜对象字面量等特定场景。

## 最终评分

**55/100**。主要需要复习 TypeScript 的结构化类型系统、函数参数逆变和返回值协变。详细讲解见 [README.md](./README.md)。
