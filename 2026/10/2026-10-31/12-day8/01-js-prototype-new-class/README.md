# 第 8 天 · 第 1 题：JavaScript 原型链、new 与 class

**评分：72/100**（上一天同类题 48/100，提升 24 分）

## 一、原型链输出

```js
function Person(name) { this.name = name; }
Person.prototype.age = 20;
Person.prototype.sayHello = function () { return `Hello, ${this.name}`; };
const p1 = new Person("Tom");
const p2 = new Person("Jerry");
console.log(p1.age); // ① 20
console.log(p1.hasOwnProperty("age")); // ② false
console.log(p1.__proto__ === Person.prototype); // ③ true
console.log(Person.prototype.__proto__ === Object.prototype); // ④ true
p1.age = 30;
console.log(p1.age); // ⑤ 30
console.log(p2.age); // ⑥ 20
delete p1.age;
console.log(p1.age); // ⑦ 20
```

输出依次为 **20, false, true, true, 30, 20, 20**。用户漏掉第④项，其他正确。

读取 p1.age 时，先查自身，再沿 [[Prototype]] 查找 Person.prototype.age。赋值 p1.age=30 在实例自身创建属性，遮蔽原型上的 age，不影响 p2。delete p1.age 只删除自身属性，不删除原型属性，所以再次读到 20。

实例原型链：p1 → Person.prototype → Object.prototype → null。

## 二、new 的执行过程

```js
function User(name) {
  this.name = name;
  return { name: "Override" };
}
const user = new User("Tom");
console.log(user.name); // Override
console.log(user instanceof User); // false
```

new 对普通构造函数的简化步骤：

1. 创建一个新对象。
2. 将新对象的 [[Prototype]] 设为构造函数的 prototype。
3. 以新对象为 this 执行构造函数。
4. 如果构造函数显式返回对象或函数，使用这个返回值；否则使用新对象。

```js
function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);
  const result = Constructor.apply(obj, args);
  if (result !== null &&
      (typeof result === "object" || typeof result === "function")) {
    return result;
  }
  return obj;
}
```

此 myNew 仅用于理解普通构造函数，不能完整模拟原生 new（例如 class 构造）。

返回 {name:"Override"} 时，返回的普通对象原型是 Object.prototype，不包含 User.prototype，所以 user instanceof User 为 false（不考虑自定义 Symbol.hasInstance）。返回 123 或 null 时，原始创建对象仍作为结果，user.name 是 Tom，instanceof User 是 true。

## 三、class 与两条原型链

```js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes a sound`; }
  static create(name) { return new Animal(name); }
}
class Dog extends Animal {
  speak() { return `${super.speak()} - Woof!`; }
}
const dog = new Dog("Buddy");
```

1. dog.speak() 返回 **Buddy makes a sound - Woof!**。
2. dog 自身没有 speak：Object.hasOwn(dog,"speak") 为 false；Dog.prototype.speak 才是重写的方法。super.speak() 调用 Animal.prototype.speak，但 this 仍为 dog。
3. Dog.prototype.__proto__ === Animal.prototype 为 true。
4. Dog.__proto__ === Animal 为 true，**不是 Animal.prototype**。
5. dog.create("Tom") 抛出 TypeError；create 是静态方法，位于 Animal 构造函数对象上。Animal.create("Tom") 和 Dog.create("Tom") 可以调用；Dog.create 通过构造函数对象的原型链继承，但此处 create 显式 new Animal，因此返回 Animal 实例。
6. class 继承基于原型机制，不是独立于原型链的系统；但 class 具有不能不经 new 调用、方法不可枚举、严格模式、派生构造函数 super 初始化等额外语义。

**实例原型链：**

```text
dog → Dog.prototype → Animal.prototype → Object.prototype → null
```

**构造函数对象原型链：**

```text
Dog → Animal → Function.prototype → Object.prototype → null
```

实例方法在第一条链上查找；静态方法在第二条链上查找。

## 四、评分

| 项目 | 得分 |
|---|---:|
| 原型链输出与属性查找 | 19/20 |
| 属性遮蔽与 delete | 10/10 |
| new 执行过程 | 15/15 |
| 返回值与 instanceof | 7/15 |
| class 实例方法与原型 | 5/15 |
| 两条继承原型链 | 8/15 |
| 静态方法与 class 机制 | 8/10 |
| **总分** | **72/100** |

[用户原始回答](./answer.md)
