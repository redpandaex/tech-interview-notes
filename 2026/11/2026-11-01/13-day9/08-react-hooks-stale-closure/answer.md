# 第 9 天 · 第 8 题：原始回答

评分：30/100

1, 因为counter每次更新都出触发组件更新,然后重新创建函数重新执行setInterval

2. 使用useCallback缓存函数引用,或者使用useRef

[参考答案](./README.md)
