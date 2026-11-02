# 第 10 天 · 第 10 题：原始回答与评分

## 主问题原始回答

> 1. 除非有明确的业务要求打通账户,否则应该跳转到租户2的登录页面,让他重新登录.重新鉴权
> 2. 先把每个权限拆开,然后把这些权限码分配给对应角色,对于老师角色在编辑或者查看时还应该去db查询权限

## 追问原始回答

> 我的回答应该是你说的意思吧,感觉也挺晚整了
>
> 1. 因为tenant_id不太一样
> 2. UPDATE course WHERE tenant_id==current_tenant_id and created_by==current_teacher_id

## 评价

用户的方向正确。应由服务端确认租户访问授权；RBAC 检查动作权限，数据库再校验课程所属租户及创建人。追问中准确识别 tenant_id 不一致，SQL 逻辑已包含两个关键条件，但需要 SET、id 及标准等号语法。

**得分：85/100。**

## 第 10 天成绩

1. Promise 并发池：95
2. React 并发渲染：90
3. TypeScript 条件类型：85
4. 浏览器布局：90
5. Tree Shaking：88
6. React 异步竞态：75
7. Flexbox：55
8. HTTP/2 与 HTTP/3：90
9. qiankun：72
10. 多租户 SaaS：85

**平均分：82.5。**
