# 专题三：ES Modules、Tree Shaking 与副作用

> 第 6 天面试复习 · 对应第 9 题（48/100）  
> 学习目标：解释 ESM 的静态结构、Live Binding、模块副作用和组件库按需打包。

## 1. ESM 与 CommonJS 的区别

**ESM：**

```js
import { add } from './math.js';
export const version = '1.0';
```

**CommonJS：**

```js
const { add } = require('./math');
module.exports = { add };
```

| 特性 | ESM | CommonJS |
|---|---|---|
| 模块依赖 | 静态 `import` / `export` 可提前分析 | `require()` 是运行时调用 |
| 动态导入 | `import()` | `require()` 可动态决定路径 |
| 导出语义 | Live Binding | 主要通过导出对象访问 |
| Tree Shaking | 通常更容易 | 通常更难可靠分析 |
| 执行环境 | 浏览器与 Node.js 原生支持 | Node.js 传统模块系统 |

ESM **也支持动态导入** `import()`，因此“ESM 所有导入都静态”是错误的。CommonJS 也不是绝对无法优化，关键是构建工具能否可靠静态分析。

## 2. Live Binding 不是复制值

`counter.js`：

```js
export let count = 0;
export function increment() {
  count++;
}
```

`main.js`：

```js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1

// count = 10; // 错误：不能重新赋值导入绑定
```

导入的是**与导出变量关联的绑定**，不是导入瞬间的值副本。导出方更新变量，导入方后续读取能观察到新值。

不要与对象引用混淆：即使导出的是 `let count = 0` 这样的原始值，Live Binding 仍然成立。

## 3. Tree Shaking 究竟删除什么？

`utils.ts`：

```ts
export function add(a: number, b: number) {
  return a + b;
}

export function multiply(a: number, b: number) {
  return a * b;
}

console.log('utils loaded');
```

`main.ts`：

```ts
import { add } from './utils';
console.log(add(1, 2));
```

- `multiply`：未被使用，且函数声明没有必须保留的副作用，通常可被删除。
- 顶层 `console.log`：即使没有导出，也是**可观察副作用**，模块执行时通常必须保留。

**副作用（Side Effect）**是执行代码对外部产生可观察影响。例如：

```js
console.log('hello');               // 控制台输出
window.__APP_READY__ = true;         // 全局变量变更
document.body.classList.add('dark'); // DOM 变更
import './styles.css';               // 可能影响页面样式
```

不能把“没有被导出”当作“没有副作用”。

## 4. package.json 的 sideEffects 字段

```json
{
  "sideEffects": false
}
```

它是**模块级别的副作用声明**，向支持该字段的打包工具说明：未使用的模块可按无副作用处理，从而帮助丢弃整模块。

**不是：**

- 关闭 Tree Shaking。
- 自动删除所有 `console.log`。
- 保证删除任意未被引用的语句。

**风险：** 如果实际存在样式注入、全局注册、polyfill 等副作用，却错误声明 `false`，构建工具可能把这些模块错误删除。

组件库常见配置：

```json
{
  "name": "my-ui",
  "sideEffects": ["**/*.css"]
}
```

意思是：CSS 文件需要作为副作用保留，其他模块可根据使用情况和构建分析被跳过。**前提：其他模块确实没有必须保留的副作用。**

不同打包器及插件对 `sideEffects`、CSS 的具体处理不同，应以真实构建结果验证。

## 5. 组件库为什么会把没用的样式也打进去？

```ts
// index.ts
import './all-components.css';
export { Button } from './Button';
export { Modal } from './Modal';
export { Table } from './Table';
```

业务只写：

```ts
import { Button } from 'my-ui';
```

即使 `Modal`、`Table` 的 JS 成功摇掉，**全量 CSS 仍可能被保留**。JS Tree Shaking 不等于 CSS 自动按组件裁剪。

### 推荐的模块边界

```text
src/
├── index.ts
├── Button/
│   ├── index.ts
│   ├── Button.tsx
│   └── style.css
├── Modal/
│   ├── index.ts
│   └── style.css
└── Table/
    ├── index.ts
    └── style.css
```

```ts
// src/Button/index.ts
import './style.css';
export { Button } from './Button';
```

根入口：

```ts
export { Button } from './Button';
export { Modal } from './Modal';
export { Table } from './Table';
```

如果实际构建产物提供独立模块，还可以用 `exports` 暴露子路径：

```json
{
  "name": "my-ui",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./button": "./dist/Button/index.js",
    "./modal": "./dist/Modal/index.js",
    "./table": "./dist/Table/index.js"
  },
  "sideEffects": ["**/*.css"]
}
```

业务可以选择：

```ts
import { Button } from 'my-ui';
// 或：
import { Button } from 'my-ui/button';
```

这里的路径必须和构建输出一致。实际组件库还需要提供 TypeScript 类型声明、处理 peerDependencies、验证 CSS 是否保留等。

## 6. 实际项目排查流程

1. 确认包是否提供真正可分析的 ESM 输出，且未提前合并为难以分析的单文件。
2. 检查 `package.json` 的 `exports`、`module`（若适用）、`sideEffects`。
3. 检查根入口是否有全局样式、polyfill、全局注册等副作用。
4. 使用 Bundle Analyzer 查看 JS 是否包含未使用组件。
5. 检查构建后的 CSS 是否包含其他组件样式。
6. 用生产构建验证，而不是仅凭源代码推断。

## 7. 面试速答（90 秒）

> ESM 的静态 import/export 结构便于构建工具分析依赖和导出使用情况，因此通常比 CommonJS 更适合 Tree Shaking。ESM 导入是 Live Binding，不是复制导出值。Tree Shaking 删除未使用且可安全移除的代码；顶层 console.log、CSS 导入等属于可能需要保留的副作用。package.json 的 sideEffects 字段是模块级副作用声明，false 不是关闭 Tree Shaking，错误设置可能导致 CSS 丢失。组件库应保留 ESM 模块边界，按组件组织 CSS，正确声明 CSS 副作用，并提供子路径导出与生产产物验证。

## 8. 自测题

1. ESM 的 `import { count }` 是值拷贝吗？
2. 未使用的 `multiply` 和顶层 `console.log`，哪个更容易删除？
3. `sideEffects: false` 会删除已使用模块内部所有 `console.log` 吗？
4. 为什么 JS 成功 Tree Shaking，CSS 仍可能全量打包？
5. `my-ui/button` 子路径导出需要哪些构建条件？

**参考：** MDN JavaScript Modules、Webpack Tree Shaking 指南、Rollup 文档。