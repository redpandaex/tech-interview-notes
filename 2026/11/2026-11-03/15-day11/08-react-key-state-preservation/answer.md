# 第 11 天 · 第 8 题：回答记录

**评分：30/100**

## 用户原始回答

> 1. 应该会吧?
> 2. 不知道,你解释一下呗,感觉你这两个题目好怪

## 反馈

原代码中，切换 userId 只会重新渲染 UserForm；同一位置、同一类型且 key 不变时，React 保留 useState 的值，因此输入框不会清空。将调用改为 `<UserForm key={userId} userId={userId} />`，key 变化会让 React 卸载旧组件并挂载新组件，重新初始化内部状态。业务场景包括切换不同用户的资料编辑表单。

详细解析见 [README.md](./README.md)。
