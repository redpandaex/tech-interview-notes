# 第 12 天 · 第 5 题：原始回答、追问与评分

**最终评分：94/100**

## 主问题

**问题 1：** 为什么 `success: boolean` 配合 `data?: T` 时，判断 `success` 后仍无法直接访问 `data`？

**问题 2：** 如何设计成功/失败的 API 响应类型，使 TypeScript 自动收窄？

### 用户原始回答（保留原文）

> 1. 因为设置了可选符号在类型中
> 2. 让我设置的话应该是这样;类似于
>
> {
>
> success:true;
>
> data:{
>
> orderId:string;
>
> status:"paid"| xxx
>
> }
>
> }|{
>
> success:false
>
> error:{
>
> code:string;
>
> message:string;
>
> }
>
> }

**反馈：** 联合类型设计正确。需要进一步理解根本原因是 `success: boolean` 与 `data?: T` 没有建立关联，而不仅仅是因为可选符号。

## 第一次追问：扩展 loading 状态

**问题：** 在 success/error 之外增加 `status: "loading"`，如何设计三分支类型？

### 用户原始回答

> 可以按照上面的扩展一下,再加一个loading状态

**反馈：** 正确，增加第三个字面量分支即可。建议使用 `status: "success" | "error" | "loading"` 作为判别字段，分别声明对应属性。

## 第二次追问：否定条件能否正确收窄？

**问题：** `if (response.status !== "error") { console.log(response.data.orderId) }` 能否通过类型检查，如何修改？

### 用户原始回答

> 1. 不能,因为还有一个loading状态的枚举
> 2. 判断response.status ==="success"和response.status==="error"之类的

**反馈：** 正确，`status !== "error"` 仍可能是 `loading`；只有 `status === "success"` 才能安全访问 `data`。这里的 loading 是字符串字面量类型，不要求声明 enum。

## 最终评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 29/30 |
| 解决方案 | 37/40 |
| 原理理解 | 19/20 |
| 边界意识 | 9/10 |
| **总分** | **94/100** |

完整解析见 [README.md](./README.md)。
