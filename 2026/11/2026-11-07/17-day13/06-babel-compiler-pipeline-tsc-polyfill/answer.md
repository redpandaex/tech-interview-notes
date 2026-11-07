# 第 13 天 · 第 6 题：原始回答与反馈

## 主问题：Babel 编译流程

### 用户原始回答

> 1. babel主要是负责将es6以上的代码转换为es5的吧
> 2. 词法分析 token生成, AST抽象语法树?
> 3. 不能,可能要依赖polyfill

**反馈：**
- 第 1 问基本正确。Babel 常用于较新 JS 语法向目标环境转换，但不只限于 ES6 转 ES5；也可通过插件处理 JSX、TS 语法等。
- 第 2 问部分正确。Token 和 AST 属于 Parse 阶段；完整流程还包括 Transform（遍历和修改 AST）与 Generate（生成代码）。
- 第 3 问正确。语法转换不等于 API 补齐，Promise、Array.prototype.includes 等运行时能力需要 Polyfill。

## 重点补充

Babel 不负责 TypeScript 类型检查；可以用 Babel 做 TS 语法剥离，用 tsc --noEmit 做类型检查。

Babel 三阶段：
1. Parse：词法分析生成 Token，语法分析生成 AST。
2. Transform：插件遍历并修改 AST。
3. Generate：生成目标代码。

