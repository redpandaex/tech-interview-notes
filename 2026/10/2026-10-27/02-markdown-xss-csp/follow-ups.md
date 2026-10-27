# 第 4 天 · 第 2 题：原始回答与追问

日期：2026-10-27 ｜状态：**已完成**，最终评分 **68/100**

## 主问题与用户原始回答

题目：分析 marked + dangerouslySetInnerHTML 的 XSS 风险；设计安全 Markdown/HTML 渲染；解释 CSP `script-src 'self'`。

> 1. 后端没有进行过滤和转义,在前端可能会被构造script脚本或者特殊URL来进行攻击
>
> 转移了,但是还是可以通过构造特殊url来进行攻击
>
> 不知道,应该是DOM型,存储型貌似是针对后端的?
>
> 2. 最好的办法是对部分标签进行转义禁止渲染,然后连接的话需要进行检查和特殊处理
> 3. 只能发起当前网站的请求,
> 4. 不行
> 5. 会导致用户界面直接被攻占

### 初步评价：45/100

发现脚本/URL 风险、过滤与检查方向正确；但混淆 React 自动转义与 dangerouslySetInnerHTML，混淆存储型/DOM 型 XSS，误解 CSP script-src 的作用。详见 [README.md](./README.md)。

## 第一轮追问

题目：
1. `<div>{content}</div>` 与 `<div dangerouslySetInnerHTML={{__html: content}} />` 哪个有 HTML 注入风险，为什么？
2. 页面 `https://app.example.com`，CSP `script-src 'self'; connect-src 'self'`：A 同源脚本、B 第三方脚本、C 跨源 fetch 是否允许？

### 用户原始回答

> 1. 所以你骗我?react.dangerouslySetInnerHTML不会转义?只有普通的string才会转义是吗?
>
> 1. B存在
> 2. 因为dangerous这个属性是考虑到用户可能有自定义html需要进行渲染的情况所以出的API,content的话react把这个视为字符串,不会渲染为html
> 3. A,script-src 'self'; connect-src 'self'限制只允许同源script执行,限制只允许发送同源域名链接,
> 4.
>
> 然后我想问一下,同源和跨域都是限定了相同的URL和端口吗?(这个也记录到问答当中)

### 评价：90/100

React 部分理解正确：普通 JSX 文本会被转义，dangerouslySetInnerHTML 则按 HTML 解析。CSP 原理基本正确，但“同源域名”不够准确，同源比较 Scheme + Host + Port，不是仅域名。A 允许，B 被 script-src 阻止，C 被 connect-src 阻止。补充了完整的同源/跨源 URL 对照表和 CORS/CSP 区别，见 README。

**用户额外问答已记录**：同源不要求完整 URL 相同；协议、主机、端口必须相同，路径/查询/哈希无关。子域名不同或端口不同都跨源；跨源请求不等于请求必然不会发送。后续追问及最终评分见下文。

## 最后一轮追问：CORS 与 Vite 代理

题目：前端 `http://localhost:5173`，后端 `http://localhost:8080`，fetch 跨源报 CORS 错。为什么？应该修改前端请求头还是后端响应头？Vite 除了后端配置还有什么解决方案？

### 用户原始回答（逐字记录）

> 1. 因为端口不同
> 2. 一般是修改后端,在开发中可以自己配置
> 3. 开发中的有一个devServer?

### 评价

1. 正确：不同端口意味着不同 Origin。
2. 正确：CORS 权限由服务端响应头声明，不能靠前端添加 Access-Control-Allow-Origin 请求头解决；可能还需处理预检与凭据。
3. 方向正确：想到开发服务器代理。**Vite 配置为 `server.proxy`，Webpack DevServer 常用 `devServer.proxy`。** 浏览器通过 `fetch("/api/users")` 请求 Vite，再由代理转发到后端，避免浏览器直接跨源请求。具体代码见 README。

## 最终评分：68/100

| 维度 | 得分 |
|---|---:|
| XSS 原理与 React 转义机制 | 13/20 |
| 存储型与 DOM 型 XSS | 7/15 |
| HTML Sanitization 与 URL 安全 | 12/20 |
| CSP 原理与工程应用 | 11/20 |
| 同源策略、CORS 与开发代理 | 25/25 |
| **合计** | **68/100** |

原始回答对 XSS 分类、React HTML 注入与 CSP 不够准确；后续追问对同源、CORS、代理掌握较好。用户主动追加的同源/跨域问答已经收录在 README 中。
