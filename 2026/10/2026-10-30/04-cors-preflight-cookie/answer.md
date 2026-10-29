# 第 6 天 · 第 4 题：用户原始回答与评分

**评分：30/100**

## 用户原始回答（逐字保留）

目标阶段这个Event.AT_TARGET是真实存在的属性吗?这个event.eventPhase也是真实存在的吗?我记得react17这个问题还导致了一个issue好像是和qiankun相关的我记得是也有可能是webcomponent相关的

1. protocol/origin/port都要相同
2. 不算,因为origin不同
3. 就是跨域,浏览器端为了安全起见会默认不接受其他域名的请求,需要服务单允许,不知道
4. 都不知道

## 评价

- **22/35**：判断不同子域名不同源正确，但同源三要素是 scheme、host、port，而不是 protocol、origin、port；CORS 主要控制跨源响应读取，并非禁止发送请求。
- **3/35**：未掌握预检请求头、允许响应头，以及 application/json 和 Authorization 触发预检的原因。
- **5/30**：未掌握 credentials 与 SameSite；需理解跨源不等于跨站，两个 HTTPS 子域名之间的 Lax Cookie 可能正常携带。

[参考答案](./README.md)
