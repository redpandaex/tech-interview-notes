# 第 6 题：真实作答与追问

状态：已完成，评分 72/100。

## 第一轮

用户原话：

> 1. 使用chrome memory去查看内存,这个不太清楚,因为内存泄露也有可能泄露的很小一部分,并且随着时间长了也不亍增长,感觉不太好判断,但是内存溢出好判断
> 2. useEffect中很容易导致的,其他的不太清楚了
> 3. 在这个组件内部的useEffect的销毁函数中使用removeEventListenr去清楚对应的

> setInteval应该也有对应的函数叫做timoueInterval?webscoket则通过函数销毁掉

点评：Chrome Memory 和 Effect cleanup 方向正确；定时器清理方法为 clearInterval，WebSocket 为 close。

## 第二轮

用户原话：

> 1. claear有效吧,remove无效,因为函数地址不同
> 2. 应该不会吧,只有在组件卸载的时候才会

点评：clearInterval 有效，removeEventListener 使用了不同函数引用而无效。Effect 的依赖变化也会触发旧 cleanup，不只在卸载时。
