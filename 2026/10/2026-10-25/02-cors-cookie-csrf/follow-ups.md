# 第 2 题：真实作答与追问

状态：已完成。以下是用户真实回答，不代表标准答案。

## 第一轮

题目：同源/同站、CORS 与 Cookie、fetch 配置及 CSRF。

用户回答原文：

> 不是同源,是同站
>
> 1. CORS的SameSite主要是是否允许跨域的,Cookie则是是否允许跨站点携带cookie
> 2. 需要设置withCrediental吗?没太理解
> 3. 还是需要吧,有点忘了CSRF攻击了,因为CSRF是需要一个码的

点评：同源和同站判断正确。SameSite 属于 Cookie；Axios 的配置为 withCredentials，fetch 的配置为 credentials。CSRF Token 是防护方式。

## 第二轮

追问：跨站表单能否发送请求，CORS 是否能阻止请求，以及 Strict 对 Cookie 的影响。

用户原文：

> 我大概懂了,这个所谓的CSRF是因为cookie可以被带到不同的站点导致的?

点评：需要强调浏览器是向目标站点发送目标站点的 Cookie，而不是把 Cookie 发给其他站点。

面试官继续追问 Strict 是否会附带 Cookie。

用户原文：

> 不会吧

点评：正确，Strict 不允许这种跨站请求携带对应 Cookie，但请求仍可能发出。其余两小问用户未直接作答，不应视为已掌握。

## 结论

已掌握：同源/同站区别、SameSite Strict 的核心行为。

待巩固：CORS 读取限制与请求发送的区别、fetch credentials、CSRF 防护层次。
