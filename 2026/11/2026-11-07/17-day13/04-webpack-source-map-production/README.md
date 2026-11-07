# 第 13 天 · 第 4 题：Webpack Source Map

Source Map 将压缩后生成代码的位置映射回原始 TS/JS 源码。生产环境可生成 hidden-source-map 并上传到 Sentry，但必须从公开部署目录排除 .map 文件。