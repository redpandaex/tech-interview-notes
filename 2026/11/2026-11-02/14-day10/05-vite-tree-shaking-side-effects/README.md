# Day 10 · Q5 — Tree Shaking、ESM 副作用与 sideEffects（88/100）

## 题目

```ts
// utils.ts
export function add(a: number, b: number) {
  return a + b;
}
export function multiply(a: number, b: number) {
  return a * b;
}
export function debug() {
  console.log("debug");
}

// analytics.ts
console.log("Analytics initialized");
export function track(event: string) {
  console.log("Track:", event);
}

// main.ts
import { add } from "./utils";
import "./analytics";
console.log(add(1, 2));
```

问题：
1. `multiply` 和 `debug` 能否被删除？为什么？
2. `analytics.ts` 顶层的 `console.log` 是否保留？
3. `package.json` 中 `sideEffects: false` 表示什么，有什么风险？
4. 组件库导入 CSS 时如何正确配置副作用声明？

假设采用保守的模块副作用分析，不考虑压缩器专门删除日志的配置。

## 参考答案

### 1. 未使用的函数可以被删除

`multiply()` 和 `debug()` 都未被引用，且定义这些函数本身没有可观察副作用，因此都可以被移除。

```ts
// 调用 debug() 时会产生副作用，但仅定义函数不会输出日志
export function debug() {
  console.log("debug");
}
```

**关键区别**：函数体内存在副作用，不等于定义函数时存在副作用。未使用的函数定义可以整体删除，不必先配置 `drop_console` 一类压缩规则。

### 2. 纯副作用导入会保留模块顶层执行

```ts
import "./analytics";
```

这种导入不需要任何导出值，但明确要求执行模块初始化代码。在保守副作用分析下：

- `console.log("Analytics initialized")` 是顶层可观察副作用，应保留；
- 未被使用的 `track()` 函数定义可以被删除。

### 3. package.json 的 sideEffects 声明

```json
{
  "sideEffects": false
}
```

这是一种面向支持它的打包工具的**模块级副作用声明**，不是 JavaScript 语言语法，也不代表所有导出函数都是纯函数。

其核心含义是：包内模块在仅被导入、而没有使用其导出时，可以被视为无需保留初始化副作用。

错误声明可能导致：

```ts
import "my-library/register-global";
import "my-library/styles.css";
```

这类依赖模块加载产生效果的导入被错误删除。

**注意：** 不同工具对 `package.json#sideEffects` 的消费方式并不完全相同。Webpack 对此字段有明确的模块裁剪语义；Rollup/Rolldown 还有自己的模块副作用分析与相关配置。不能把某一工具的实现细节无条件套用到所有 Vite 版本。

### 4. CSS 副作用陷阱

```ts
// button.ts
import "./button.css";
export function Button() {
  return document.createElement("button");
}
```

即使业务代码使用 `Button()`，如果打包工具根据错误的副作用声明删除了 CSS 导入，按钮仍可能创建成功，但样式丢失。

对于采用 `sideEffects` 字段进行裁剪的构建链，可以声明：

```json
{
  "sideEffects": ["**/*.css"]
}
```

含义：CSS 文件具有需要保留的模块级副作用；其他未列出的模块可按无模块级副作用处理。

也可以只列出具体文件（路径应匹配**发布包中的实际路径**）：

```json
{
  "sideEffects": ["./dist/button.css"]
}
```

注意字段是 **sideEffects（复数）**，glob 路径一般使用相对于包根目录的匹配方式。

## 概念区分

| 概念 | 说明 |
| --- | --- |
| Tree Shaking | 根据静态依赖与副作用分析移除未使用代码 |
| 未使用导出 | 没有被引用的导出绑定，可在安全时删除 |
| 函数调用副作用 | 调用函数后才发生的日志、网络请求等 |
| 模块级副作用 | 模块初始化/导入时就会发生的可观察行为 |
| `sideEffects` | 向支持该字段的工具提供模块级副作用信息 |

## 评分

**88/100**。正确理解未使用导出、顶层副作用与错误声明的风险；需要更精确地区分函数内部副作用与模块级副作用，并熟悉 CSS 的 `sideEffects` glob 配置。