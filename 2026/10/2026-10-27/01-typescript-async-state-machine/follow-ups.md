# 第 4 天 · 第 1 题：原始回答、追问与评分

日期：2026-10-27 ｜状态：两轮追问完成 ｜最终评分：**75/100**

## 主问题

### 题目
1. `loading: boolean; data?: Order; error?: string` 的问题与不合理状态。
2. 重新设计 OrderState，使状态与数据关联。
3. 新增 cancelled 状态时用编译器发现漏处理的分支。

### 用户原始回答（保留原话）

> 1.这个感觉设计的状态就有问题,有可能同时出现loading和error的话要先展示error吧,其次是没有做竞态处理
>
> 应该是可以出现的,需要有一个success的状态,用来处理这个loading为false,同时error状态也应该处理一下,让loading为false展示错误信息
>
> 2. interface {
>
> &#x20;       loading:boolean
>
> &#x20;      success: boolean | null
>
> &#x20;       data:.......
>
> }
>
> 这样设置,先去判断success的状态
>
> 3. 不知道

### 评价
正确发现相互矛盾的状态组合，并主动联想到竞态。但增加 `success: boolean | null` 仍允许矛盾状态和成功无数据。正确建模为可辨识联合类型；`never` 可实现穷尽检查。完整答案见 [README.md](./README.md)。

## 第一轮追问

### 题目
1. `Result = {success:true; data:{id:number;name:string}} | {success:false;error:string}`，在 `if(result.success)` 分支访问 `data.name`、else 访问 `error` 是否通过检查？为什么布尔值可以做判别字段？
2. `Status = "idle" | "loading" | "success"`，switch 只处理 idle、loading，default 中 `const value: never = status` 是否编译通过？原因？

### 用户原始回答（首次发送）

> 1. 应该可以吧,sucess
> 2. 他会判断联合类型的其他剩余值的分支数量吧

### 用户原始回答（补全后再次发送）

> 1. 应该可以吧,sucess
> 2. 他会判断联合类型的其他剩余值的分支数量吧
>
> 1. 不能,"success"和never冲突了
> 2. &#x20;const value: never = status;
> 3. 因为分支没有穷尽

### 评价
结论均正确；需进一步说明 `success: true` 和 `success: false` 是布尔字面量类型，不是普通 boolean。第二问明确指出剩余 `"success"` 不能赋值给 never。追问评分 **90/100**。

## 第二轮追问

### 题目
给定 `ApiResult<User>` 和直接将 `await response.json()` 返回为 `data` 的 `getUser`。服务器返回 `{"id":"123","name":100}`：
1. TS 能否编译期发现？
2. 如何在运行时确保数据符合 User？

### 用户原始回答

> 1. 肯定不能,ts只能保障编译时的类型,不能保证运行时的类型正确
> 2. 使用zod去判断,不过一般业务里面不会严格一般都是直接找后端,如果两种都有的话使用联合类型兼容一下,或者使用number转化一下

### 评价
两问核心正确。补充：`response.json()` 在标准 DOM 定义中返回 any，泛型/断言不校验数据；Zod 的 safeParse 可做运行时验证。与后端协调修复是合理做法，但随意扩宽联合类型可能掩盖接口契约问题，数值转换还需处理 NaN 等异常。

## 最终评分：75/100

| 维度 | 得分 |
| --- | ---: |
| 不合理状态组合 | 18/20 |
| 联合类型建模 | 8/25 |
| 类型收窄 | 16/20 |
| never 穷尽检查 | 15/15 |
| 编译期与运行时校验 | 18/20 |
| **合计** | **75/100** |

用户已经理解基础类型收窄、never 穷尽检查、编译期与运行时区别；需要练习在首次独立设计时主动用联合类型表示互斥业务状态。
