# 第 9 天 · 第 2 题：原始回答

评分：100/100

```ts
type MyPick<T,K extends keyof T>={
[P in K]: T[P]
}
```

[参考答案](./README.md)
