# 第 8 天 · 第 2 题：用户原始回答

**评分：67/100**

## 原始回答（逐字保留）

1. 阻止JS读取这个cookie,不能
2. 只能用https访问;不一定
3. Strict是不允许跨站请求,Lax是有限制
4. 你说的是第三方的网站的cookie会不会被携带过来吗?那要看是哪种第三方网站吧,还有哪种请求
5. 不会吧



1. 因为这里react会把这个当成html渲染,这个里面如果没有被处理的话可能会被执行js脚本
2. 弹窗告警
3. 不是,httponlly只能防止js不读取cookie,但是阻止不了其他的行为,xss脚本利用js可以做其他很多事
4. 这个react会进行转义,dangerouslySetTinnerHTML一般是用户自定义一个ui之类的
5. 在服务端对一些特殊标签进行过滤和特殊处理,比如script,a,img等等



1. CSRF本质上是cookie可以被携带到第三方网站,不需要知道
2. 假设用户在网站A登录,然后跳转携带cookie到了恶意网站B,B可以携带这个cookie伪造请求给网站A的服务端,进行恶意攻击
3. 不能,这个是限制了禁止跨站请求,但是也有办法比如说在网站A有漏洞,被嵌入了iframe这个里面发起请求也有可能发起CSRF
4. 不知道
5. 理论上应该还存在?

## 主要问题

- CSRF 不是把 A 的 Cookie 发送给 B，而是浏览器向 A 发请求时可能自动携带 A 的 Cookie。
- SameSite=Lax 通常允许跨站顶层安全方法导航携带 Cookie，但不允许普通跨站 fetch POST 携带。
- 需要掌握 CSRF Token 生成、分发、提交与服务端验证。
- 完全依赖显式 Authorization Bearer 请求头、无自动携带认证凭据时，通常不存在传统 Cookie 型 CSRF 风险。

[参考答案](./README.md)
