# 第 7 天 · 第 1 题：JavaScript 原型链、new 与 class 继承

**评分：48/100**

## 题目

### 1. 原型链

```js
function Person(name) { this.name = name; }
Person.prototype.sayHello = function () { return `Hello, ${this.name}`; };
const p = new Person("Tom");
```

解释 p.__proto__、Person.prototype 与 Person.__proto__、p.constructor === Person、p.sayHello() 的查找过程。

### 2. new 操作符

解释 new User("Alice") 的内部步骤，并手写简化版 myNew。

### 3. class 继承

解释 class 是否完全等价于 prototype、Dog.prototype.__proto__、Dog.__proto__、super() 与 this、dog instanceof Animal。

## 参考答案

### 两条原型链

```js
Object.getPrototypeOf(p) === Person.prototype; // true
Object.getPrototypeOf(Person) === Function.prototype; // true

Object.getPrototypeOf(dog) === Dog.prototype; // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true
Object.getPrototypeOf(Dog) === Animal; // true
```

实例原型链：dog -> Dog.prototype -> Animal.prototype -> Object.prototype -> null。
构造函数原型链：Dog -> Animal -> Function.prototype -> Object.prototype -> null。

p.constructor 通常通过 Person.prototype.constructor 查到 Person，而不是 p 自身有该属性。p.sayHello() 先查找实例自身，再沿 [[Prototype]] 查找；方法调用时 this 指向 p。

### new

1. 创建新对象。
2. 设置新对象的 [[Prototype]] 为构造函数的 prototype。
3. 以新对象为 this 执行构造函数。
4. 如果构造函数返回对象，则使用该对象；否则返回新对象。

```js
function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);
  const result = Constructor.apply(obj, args);
  if (result !== null && (typeof result === "object" || typeof result === "function")) {
    return result;
  }
  return obj;
}
```

这是普通构造函数的教学简化版，不支持原生 class 的构造语义。更通用的实现可以直接调用 Reflect.construct(Constructor, args)。

### class

class 基于原型继承机制，但类构造函数必须 new 调用，类方法默认不可枚举，且有 super、私有字段等专门语义。派生类构造函数在 super() 完成实例初始化之前不能使用 this。默认 instanceof 判断构造函数的 prototype 是否位于实例原型链中，因此 dog instanceof Animal 为 true。

## 本题评分

**48/100**。基本掌握实例原型查找和 instanceof，但混淆函数对象自身的原型链与 prototype 属性；new 的四个步骤与 super 的初始化语义需加强。

原始回答见 [answer.md](./answer.md)。
