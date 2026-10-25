# 第 4 题：真实作答与追问

> 2026-10-25 · 已完成 · 70/100

## 第一轮：Proxy、解构与 API

问题：Proxy 如何收集依赖；reactive 解构是否保留响应性；ref、reactive、computed、watch 有何区别？

用户原话：

> 1. 之前使用defineProperiety有限制,不能对数组生效等问题,Proxy里面代理这个对象,可以通过这个对象来读取到,那就不知道了,感觉是通过在proxy的api中通知到的
> 2. 不具有响应式,有refAPI或者在应该还有其他的方法?
> 3. ref一个是元素的引用,其次是将一个基础值变为响应式,reactive是讲一个对象编程响应式,computed是类似于useMemo计算缓存接口,watch则是监听某个对象是否发生变化,然后做出擦做

点评：基本概念正确；defineProperty 并非完全无法处理数组，而是 Vue 2 对索引赋值、length 等存在限制。需补足 track/trigger、toRef/toRefs 和 computed 与 watch 的用途差别。

## 第二轮：依赖粒度与惰性求值

问题：watchEffect 只读取 state.count，修改 state.name 会重新执行吗？从未读取 double.value，computed getter 会执行吗？

用户原话：

> 1. 不知道啊,没怎么写过vue3用过这个新的API,我猜应该会吧,因为这个watchEffect会在更新时自动执行?因为没有加监听值,这个类似于useEffect,感觉,不知道
> 2. 会默认执行一次吧,然后组件更新的时候也会执行?

点评：两问均不正确。watchEffect 只追踪同步执行时实际读取的响应式依赖，因此 name 变化不触发。computed 是惰性求值，未读取 .value 时不会运行 getter；依赖变更只会使缓存失效，后续读取时才重新计算。

## 结果

模拟评分：70/100。基础 API 认识较好，需加强依赖收集与调度机制。
