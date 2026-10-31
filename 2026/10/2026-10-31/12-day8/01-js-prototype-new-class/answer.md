# 第 8 天 · 第 1 题：用户原始回答

评分：72/100

## 原始回答（逐字保留）

1. 20;false;true;30;20;20;
2. js会通过原型链往上找
3. 因为这个p1.age是相当于给p1单独加了一个属性,不会改变p2原型链上共享的age
4. 删除的只是p1本身的,原型链上的没有删除



1. overried
2. 创建一个空的对象,然后将这个对象的原型设置为User.prototype指向的对象,然后使用User.call(temp,arg1)来执行一次,让this指向这个新对象,然后根据构造函数的返回值来决定new的结果,如果没有显示return时,则返回temp;如果返回原始值时也返回temp,如果返回对象或者函数,则用这个返回去替代tremp
3. 不知道
4. 会返回那个temp然后导致user.name为Tom



1. Buddy makes a sound - Wooof
2. 有吧,重写了,存在dog.speak()
3. Animal.prototype
4. 指向animal.prototype吗
5. 可以的
6. 不是
7.

## 评价

原型链属性查找和属性遮蔽正确；new 的四步及原始值返回规则掌握良好。漏答第④项；需补充显式对象返回时 instanceof 为 false、类实例方法位于原型、构造函数的静态继承链、实例无法直接调用静态方法。

[参考答案](./README.md)
