# 第 7 天 · 第 1 题：用户原始回答

**评分：48/100**

## 原始回答（逐字保留）

1. 指向Person.prototype所指向的对象
2. 应该没区别?但是__proto__不是原来对象
3. 成立,p.constructor不就是p的构造函数吗?
4. 先查找p上有没有,没有的话沿着原型链去**proto**上寻找



1. 改变了this的指向吧
2. 忘记了



1. 不是
2. Object.prototype吧
3. 不知道
4. 因为要继承父类的构造函数
5. true吧

## 评价

原型链查找、class 不完全等价于传统构造函数、instanceof 的结论正确。Person.prototype 与 Person.__proto__ 不同；p.constructor 通常继承自 Person.prototype；new 包含创建对象、连接原型、调用构造函数及处理返回值；Dog.prototype 的原型是 Animal.prototype，Dog 函数对象的原型是 Animal；派生类必须在 super() 初始化 this 后访问 this。

参考答案见 [README.md](./README.md)。
