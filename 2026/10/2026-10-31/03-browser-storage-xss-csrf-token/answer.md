# 第 7 天 · 第 3 题：用户原始回答与评分

**评分：49/100**

## 用户原始回答（逐字保留）

1. Cookie的生命周期是可以通过js或者服务端设置的,localStorage应该是随硬盘的,sessiosStorage跟随tab走的好像是
2. 只有cookie有可能会
3. sesionStorage貌似是绑定tab id的
4. 因为这个存储很久



1. httponly防止js访问该条cookie,
2. 不能
3. XSS是cookie攻击,CSRF则是跨站的请求攻击
4. 应该不能



1. 可能会被脚本窃取
2. 防止被js窃取cookie
3. 一个长tooken一个周期短token
4. 使用axios的话可以加一个全局的flag

## 评价

Cookie 生命周期和自动携带、sessionStorage 的标签页隔离、HttpOnly 限制 JS 读取、Token 被脚本窃取风险等基本方向正确。XSS 不是 Cookie 攻击；localStorage 的主要敏感凭证风险是同源 JS 可读取；SameSite=Lax 不能全面防 CSRF；Token 刷新还需并发等待、失败处理和原请求重试。

[参考答案](./README.md)
