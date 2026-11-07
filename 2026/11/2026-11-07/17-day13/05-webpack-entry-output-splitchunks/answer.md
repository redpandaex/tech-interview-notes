# 第 13 天 · 第 5 题：原始回答、追问与反馈

## 主问题：Entry、Output、Mode

### 用户原始回答

> 1. entry负责的依赖解析的入口,webpack会把这个配置视为一个入口去进行解析,output是产物输出路径,mode则是代表这次配置是开发还是生产环境的配置
> 2. 会被打包两次
> 3. name表示文件原来的名称,contenthash表示内容的hash,文件名有可能有特殊符号,也不安全

**反馈：**
- 第 1 问正确。Entry 是依赖图入口，Output 控制输出，Mode 选择构建模式。
- 第 2 问基本正确。两个入口可能各自包含共享模块；splitChunks 可以提取公共模块。
- 第 3 问部分正确。contenthash 是基于内容的 Hash；[name] 是 Entry/Chunk 名称，不是原始文件名。contenthash 的主要价值是缓存失效控制，不是文件名安全。

## 第一次追问：chunks: all

### 用户原始回答

> 1. 不太记得了
> 2. 都需要

**反馈：**
- chunks: async 是默认值，主要处理异步 Chunk。
- initial 只处理初始 Chunk。
- all 同时考虑初始与异步 Chunk。
- 两个入口都依赖 common.js 时，各自页面都需要加载该公共 Chunk；同一页面会话中模块可能被运行时复用，跨页面或刷新还会受到浏览器 HTTP 缓存影响。

## 第二次追问：公共 Chunk 过大与 Tree Shaking

### 用户原始回答

> 1. 不一定合理
> 2. 使用Tree Shaking来进行拆分,但是在webpack中这个要怎么配置呢?是不是就不能拆分成公共依赖了呢?

**反馈：**
- “不一定合理”正确。一个很大的公共 Chunk 可能让只需要少量代码的页面也下载过多资源。
- Tree Shaking 与公共依赖拆分并不冲突。Tree Shaking 删除未使用的导出，splitChunks 负责模块如何分组到 Chunk。
- Webpack production mode 默认启用相关优化；可以了解 usedExports、minimize、sideEffects 与 splitChunks 的配合。
- 如果公共 Chunk 仍然过大，可以拆分模块、路由级动态 import，并调整 cacheGroups。

