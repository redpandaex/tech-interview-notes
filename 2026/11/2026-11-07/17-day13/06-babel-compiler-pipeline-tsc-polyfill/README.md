# 第 13 天 · 第 6 题：Babel 编译流程、tsc 与 Polyfill

**方向：JavaScript 工程化 / Babel / TypeScript / 编译原理**  
**难度：L1–L2**

## 一、题目

输入代码：

```ts
const greet = (name: string): string => {
  return `Hello, ${name}`;
};
```

转换后：

```js
var greet = function (name) {
  return "Hello, " + name;
};
```

问题：
1. Babel 的主要作用是什么？它和 TypeScript 编译器 tsc 有什么区别？
2. Babel 编译代码大致经历哪几个阶段？提示：AST。
3. Babel 将箭头函数转换成普通函数后，是否也能自动为旧浏览器补齐 Promise、Array.prototype.includes 等 API？

## 二、Babel 的作用

Babel 是 JavaScript 编译工具，常用于将较新的 JavaScript 语法转换为目标环境可支持的语法。它也可以通过插件处理 JSX、TypeScript 语法等。

常见转换：
- 箭头函数转换为普通函数。
- let / const 转换为 var（取决于目标环境和配置）。
- Class 语法转换。
- JSX 转换。
- TypeScript 类型语法剥离（需要对应插件或 preset）。

Babel 不只局限于 ES6 转 ES5，实际转换结果取决于目标浏览器和 Babel 配置。

## 三、Babel 与 tsc 的区别

| 对比 | Babel | tsc |
|---|---|---|
| 主要用途 | JavaScript 语法转换 | TypeScript 编译 |
| 类型检查 | 不负责 | 负责 |
| TS 类型剥离 | 可以通过 preset/plugin | 可以 |
| JS 语法转换 | 可以 | 可以，取决于 target |
| 声明文件 .d.ts | 不负责生成 | 支持生成 |

例如 Babel 可以将 TS 语法剥离并输出 JS，但它不会替代 TypeScript 类型检查。项目可以用 Babel 负责快速转换，用 tsc --noEmit 单独做类型检查。

## 四、Babel 的三个阶段

```text
源代码
  ↓
Parse（解析）
  ├── 词法分析：源代码 → Token
  └── 语法分析：Token → AST
  ↓
Transform（转换）
  └── 遍历 AST，通过插件修改节点
  ↓
Generate（生成）
  └── 将转换后的 AST 生成 JavaScript 代码
```

记忆：解析、转换、生成。

用户回答的“词法分析、Token、AST”属于 Parse 阶段，后面还要补上 Transform 和 Generate。

## 五、语法转换与 Polyfill

必须区分：

- **语法转换（Syntax Transformation）**：把目标环境不支持的语法改写成兼容形式，例如箭头函数。
- **Polyfill**：为运行环境补充缺失的 API，例如 Promise、Array.prototype.includes。

例如 Babel 可以转换：

```js
const fn = (value) => value + 1;
```

但它不会仅仅因为转换箭头函数，就自动让旧浏览器拥有 Promise。

项目可使用 `@babel/preset-env` 配合 `core-js`，根据目标环境配置所需 Polyfill。现代项目应避免无差别地注入所有 Polyfill，以免增加包体积；按目标环境和使用方式配置。

## 六、面试简答模板

> Babel 主要用于将较新的 JavaScript 语法转换成目标环境支持的语法，也能通过插件处理 JSX、TypeScript 语法等。它和 tsc 的区别是 Babel 不负责 TypeScript 类型检查，而 tsc 可以进行类型检查并生成声明文件。Babel 编译主要分为 Parse、Transform、Generate 三个阶段：先把源代码解析成 AST，再通过插件转换 AST，最后生成代码。语法转换不等于 API 补齐，Promise 等运行时 API 需要通过 Polyfill，例如 core-js。

## 七、用户回答与反馈摘要

用户原始回答：
1. “babel主要是负责将es6以上的代码转换为es5的吧”
2. “词法分析 token生成, AST抽象语法树?”
3. “不能,可能要依赖polyfill”

反馈：
- 第 1 问基本正确，但 Babel 不只负责 ES6 转 ES5，也可处理 JSX、TS 语法等。
- 第 2 问回答了 Parse 阶段的词法分析和 AST，补充 Transform 与 Generate。
- 第 3 问正确，语法转换不能替代 Polyfill。
