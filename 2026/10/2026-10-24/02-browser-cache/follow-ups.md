# 第 2 题 · 交互记录

## 第一轮：HTTP 缓存原理

**用户回答摘要：** URL/method 与 Vary 匹配后判断 Cache-Control；区分 max-age 与 Expires；缓存不新鲜时转入协商缓存；ETag 优先于 Last-Modified；HTML 设置 no-cache、哈希静态资源设置较大 max-age。

**点评：** 总体方向正确。纠正 `Vary` 比较的是请求头；`must-revalidate` 不妨碍新鲜缓存复用；启发式新鲜度不是显式新鲜度过期后的补救手段；正确名称为 `If-Modified-Since`。哈希资源无需为版本额外设计 Vary 请求头。

## 第二轮：旧 Chunk 被删除

**追问：** 旧标签页的动态 import 引用已删除的 Chunk 会怎样？HTML 配置 no-cache 能否保证旧标签页自动更新？

**用户回答摘要：** Chunk 请求出错，缺少错误处理可能使页面报错；希望通过 HTML 强制刷新恢复。对 no-cache 是否能使旧 SPA 始终最新判断为不一定，但不清楚原因。

**点评：** 请求失败的判断正确；更可靠的是保留旧 Chunk、先上传资产后切 HTML、使用 Error Boundary 与刷新恢复提示。no-cache 约束的是缓存复用，不会主动重启/更新当前已运行的 SPA。

## 模拟评分
80/100（基于这次交流的练习分数，并非正式测评）。
