# 第 5 天 · 第 3 题：原始回答与评分

评分：78/100

## 用户原始回答

> 1. 对getPorperty函数参数使用了any,我感觉应该是用unknown会好一点,去进行一个类型收缩再进行判断没报错也是因为key只是限制了string类型,所以email没有报错
>
> 2. 可以如下
>
> function getProperty\<T,K>(obj:T,key: K extends keyof T):T[K]{
>
> }
>
> 你看下这样可以吗?
>
> 3. keyof user是枚举出User的key,最终结果为"id"|"name"|"age"|"boolean"
>
> User[keyof User]则是获取User上key对应的类型

## 评价

- 类型安全问题：27/30。正确发现 any 和 string 太宽泛；unknown 需要收窄，本题用泛型更合适。
- 泛型实现：24/40。正确写出 T[K]，但泛型约束必须写成 `<T, K extends keyof T>`，函数体需要 `return obj[key]`。
- keyof 与索引访问：27/30。keyof User 的最后一个属性名应是 active，而不是 boolean；User[keyof User] 为 string | number | boolean。

完整答案见 [README.md](./README.md)。
