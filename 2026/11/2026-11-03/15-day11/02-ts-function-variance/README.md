# 第 11 天 · 第 2 题：TypeScript 函数类型兼容性

**评分：55/100**

## 题目

开启 `strict: true`，判断四次赋值的合法性，并解释参数逆变与返回值协变。

```ts
interface Animal {
  name: string;
}

interface Dog extends Animal {
  bark(): void;
}

type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

declare let animalHandler: AnimalHandler;
declare let dogHandler: DogHandler;

dogHandler = animalHandler; // ①
animalHandler = dogHandler; // ②

type AnimalFactory = () => Animal;
type DogFactory = () => Dog;

declare let animalFactory: AnimalFactory;
declare let dogFactory: DogFactory;

animalFactory = dogFactory; // ③
dogFactory = animalFactory; // ④
```

## 正确答案

| 赋值 | 结果 | 理由 |
|---|---|---|
| ① `dogHandler = animalHandler` | 合法 | 能处理所有 Animal 的函数必然能处理 Dog |
| ② `animalHandler = dogHandler` | 非法 | 调用方可能传入没有 bark 方法的 Animal |
| ③ `animalFactory = dogFactory` | 合法 | 返回 Dog 满足返回 Animal 的要求 |
| ④ `dogFactory = animalFactory` | 非法 | 返回 Animal 不保证具备 Dog 的 bark 方法 |

## 一、结构化类型：Dog 可以作为 Animal 使用

TypeScript 的对象类型主要采用结构化兼容性：拥有目标类型所需成员即可兼容。

```ts
interface Animal {
  name: string;
}

interface Dog extends Animal {
  bark(): void;
}

const dog: Dog = {
  name: "旺财",
  bark() {
    console.log("汪");
  },
};

const animal: Animal = dog; // 合法
```

`Animal` 要求有 `name`；`Dog` 同时提供 `name` 和 `bark`，因此满足要求。反向赋值通常不合法，因为 `Animal` 不保证存在 `bark`。

**注意：**直接给类型为 `Animal` 的变量赋带额外字段的对象字面量，可能触发多余属性检查（excess property checks）。这不改变一般结构化类型兼容性的方向。

## 二、函数参数：逆变

在 `strictFunctionTypes: true` 下，普通函数类型的参数主要按逆变检查。

```ts
const handleAnimal = (animal: Animal) => {
  console.log(animal.name);
};

const handleDog = (dog: Dog) => {
  dog.bark();
};

let dogHandler: (dog: Dog) => void = handleAnimal; // 合法
let animalHandler: (animal: Animal) => void = handleDog; // 非法
```

解释：

- 需要 `DogHandler` 的地方，只会向函数传入 Dog。能够处理任意 Animal 的 `handleAnimal` 可以安全接收 Dog。
- 需要 `AnimalHandler` 的地方，可能传入普通 Animal。只接受 Dog 的 `handleDog` 可能访问不存在的 `bark`，因此不安全。

**记忆：参数越宽泛，越容易作为替代函数。**

## 三、函数返回值：协变

```ts
type AnimalFactory = () => Animal;
type DogFactory = () => Dog;

declare const createAnimal: AnimalFactory;
declare const createDog: DogFactory;

const animalFactory: AnimalFactory = createDog; // 合法
const dogFactory: DogFactory = createAnimal;    // 非法
```

解释：

- 调用方要求返回 Animal，只需要 `name`；返回 Dog 必然满足。
- 调用方要求返回 Dog，可能调用 `bark()`；返回 Animal 不能保证该方法存在。

**记忆：返回值越具体，越容易作为替代函数。**

实际运行时返回的 Dog 对象不会因为变量被标注为 Animal 而丢失 `bark`，只是静态类型不允许直接访问未声明的方法。

## 四、追问

```ts
const fn = (animal: Animal): Dog => ({
  name: animal.name,
  bark() {},
});

type Handler = (dog: Dog) => Animal;

const handler: Handler = fn; // 合法
```

**正确答案：合法。**

- 参数：`fn` 接收 Animal，因此能够接收 Handler 调用方传入的 Dog。
- 返回值：`fn` 返回 Dog，满足 Handler 要求的 Animal。

### 对照表

| 位置 | 兼容方向 | 直观解释 |
|---|---|---|
| 函数参数 | 逆变 | 接收范围越广，越安全 |
| 函数返回值 | 协变 | 保证返回的类型越具体，越安全 |

## 五、边界与补充

- 本题讨论**普通函数类型**，不是对象方法签名。TypeScript 的 `strictFunctionTypes` 对方法签名存在特殊的双变检查例外，不能一概而论。
- TypeScript 的类型兼容是静态检查，不会在运行时自动删除多余属性。
- 对泛型容器和复杂类型的型变，需要结合成员的输入、输出位置判断，不要机械套用“所有参数逆变、所有对象协变”。

## 六、评分依据

**55/100**。用户四个赋值判断均反向，追问也判断错误；能够通过“大容器”类比逐渐理解参数方向，且明确提出返回值为什么能包含额外属性的关键疑问。需重点掌握结构化兼容与参数、返回值的方向区别。
