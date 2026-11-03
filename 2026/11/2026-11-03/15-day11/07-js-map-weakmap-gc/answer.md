# 第 11 天 · 第 7 题：原始回答与评分

**最终评分：85/100**

## 题目

```js
const map = new Map();
const weakMap = new WeakMap();

let element = document.createElement("div");

map.set(element, { count: 1 });
weakMap.set(element, { count: 1 });

element = null;
```

1. Map 和 WeakMap 对对象键的引用有什么区别？DOM 元素能否被垃圾回收？
2. 为什么 WeakMap 不支持 keys、values、size？实际开发中有什么使用场景？

## 用户原始回答

> 1. Map是强引用,不能被垃圾回收,WeakMap可以被垃圾回收,不能了已经,因为设置element=null并不意味着不可达
> 2. 因为这些key不确定有没有被回收,循环引用的时候可以用这个

## 反馈

- **第 1 问：基本正确。** Map 对键持有强引用，WeakMap 不会仅因键存在而阻止回收。题目中 Map 仍持有 DOM 元素，因此 `element = null` 不足以使其不可达。
- **第 2 问前半：正确。** WeakMap 的键可能随 GC 消失，无法提供稳定的遍历或 size。
- **第 2 问场景：不准确。** 现代 JS GC 可以回收不可达的循环引用；WeakMap 的典型用途是为 DOM 节点或其他对象保存关联状态/缓存，而不希望映射强引用键。

## 最终评分

**85/100**。主要需巩固可达性、循环引用与弱引用缓存之间的区别。

详见 [README.md](./README.md)。
