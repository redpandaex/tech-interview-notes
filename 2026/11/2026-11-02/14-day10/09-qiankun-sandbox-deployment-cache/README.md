# Day 10 · Q9 — qiankun 沙箱、副作用清理与独立部署缓存

**评分：72/100**

## 题目

主应用 React 18，子应用 A React 17、子应用 B Vue 3，均通过 qiankun 集成并独立部署。

子应用 A：

```js
window.appConfig = { theme: "dark" };
window.addEventListener("resize", () => {
  console.log("SubApp A resized");
});
```

切换到 B 后，出现全局变量污染和事件监听器残留。与此同时，A 发布 v2 后，部分用户仍加载 v1。

问题：
1. qiankun 的 JavaScript 沙箱如何隔离普通全局变量？为什么事件监听器不能只依赖 Proxy？
2. 主/子应用入口 HTML 和带 hash 的 JS/CSS 如何配置缓存？为什么只有 hash 不够？
3. 追问：CDN 已更新，HTML 设置 `no-cache`，用户不刷新主应用，仅在 A、B 间切换却仍看到 v1，原因与处理方案是什么？

## 参考答案

### 1. ProxySandbox 与 fakeWindow

qiankun 存在 ProxySandbox、LegacySandbox、SnapshotSandbox 等沙箱实现，具体行为取决于版本和运行模式。

ProxySandbox 的核心思想是将部分全局属性访问重定向到沙箱对象，避免子应用直接修改真实的全局对象。

下面仅为**说明原理的简化示例**，不是 qiankun 的实际源码：

```js
const fakeWindow = {};

const sandboxWindow = new Proxy(fakeWindow, {
  get(target, key) {
    // 优先读取当前沙箱中的属性
    if (key in target) return target[key];

    // 未覆盖的属性回退到真实全局对象
    return window[key];
  },

  set(target, key, value) {
    // 普通属性写入落在沙箱中
    target[key] = value;
    return true;
  },
});
```

配合适当的代码执行包装与作用域处理，子应用代码访问到的 `window` 可以被沙箱代理。因此 `window.appConfig = ...` 之类的普通赋值可以受到隔离。

**限制**：Proxy 不是浏览器进程级隔离。子应用仍共享 DOM、浏览器运行环境及部分全局能力；还需要 CSS 隔离、生命周期清理和 API patch 等配套措施。

### 2. 为什么事件监听器不能只靠 Proxy？

```js
window.addEventListener("resize", handler);
```

与 `window.appConfig = ...` 不同，这不是单纯的属性写入，而是**调用会修改浏览器全局事件系统的方法**。

只拦截 `get` / `set` 不足以自动撤销方法调用的外部副作用。即使属性访问经过 Proxy，真实事件监听器仍可能被注册。

qiankun 的配套 patcher 可以追踪部分全局副作用，例如 `addEventListener` / `removeEventListener`，并在相应生命周期执行清理或恢复。出现残留时应排查：

1. 是否使用了 qiankun 可追踪的全局 API；
2. 是否绕过代理直接访问真实 window；
3. 子应用是否真正触发 unmount；
4. 是否存在定时器、第三方库订阅、DOM 事件等额外清理责任。

建议业务侧仍明确管理自己创建的资源：

```js
// 持有稳定的 handler 引用，以便移除
const onResize = () => {
  console.log("SubApp A resized");
};

// 子应用挂载时注册
export async function mount() {
  window.addEventListener("resize", onResize);
}

// 子应用卸载时主动释放
export async function unmount() {
  window.removeEventListener("resize", onResize);
}
```

这是生命周期清理示例；真实项目还需要考虑 qiankun 的 mount/unmount 入口签名及其他清理工作。

### 3. HTML 与 hash 静态资源的缓存策略

| 资源 | 典型 Cache-Control | 原因 |
| --- | --- | --- |
| 主应用入口 HTML | `no-cache` | 可以存储，但复用前必须验证新鲜度 |
| 子应用入口 HTML | `no-cache` | 避免长期使用旧版资源引用 |
| 带内容 hash 的 JS | `public, max-age=31536000, immutable` | 内容变化则 URL 变化 |
| 带内容 hash 的 CSS | `public, max-age=31536000, immutable` | 同上 |

`no-cache` **不等于** `no-store`。前者允许缓存但要求重新验证；后者要求不存储。

为什么仅有 hash 不够？

```html
<!-- v1 入口 -->
<script src="/assets/app.111.js"></script>

<!-- v2 入口 -->
<script src="/assets/app.222.js"></script>
```

浏览器只根据当前 HTML 中的 URL 加载资源。如果入口 HTML 仍是 v1，就仍然请求 `app.111.js`，不会自动发现 `app.222.js`。

### 4. 部署顺序与旧资源保留

建议：
1. 先上传新版 hash JS/CSS，确认资源可访问；
2. 再发布引用新资源的入口 HTML；
3. 保留旧 hash 资源一段时间，避免正在运行的旧页面动态加载资源时发生 404；
4. 排查 CDN、Service Worker、浏览器 HTTP 缓存与微前端运行时缓存。

### 5. 追问：不刷新主应用仍看到 v1

**关键区分：HTTP 缓存与 JavaScript 内存缓存是不同层次。**

qiankun 及其入口加载器（如 import-html-entry）可能缓存已获取的入口、脚本等内容，或者复用已有的加载结果。具体缓存行为依赖版本和加载方式。

```text
首次进入 A
  → 请求入口 HTML
  → 解析并加载 JS/CSS
  → 挂载 A v1

切换到 B，再切回 A
  → 加载器可能复用内存中的旧资源
  → 没有再次发起入口 HTTP 请求
  → 即使 CDN 已有 v2，仍运行 A v1
```

HTTP `Cache-Control: no-cache` 仅在 HTTP 缓存条目被尝试复用时要求验证；**若没有网络请求，它不能强制 JavaScript 加载器重新拉取资源**。

排查流程：

1. Chrome DevTools → Network，切换 B → A，观察是否重新请求入口 HTML。
2. **没有入口请求**：排查 qiankun 预加载/加载器内存缓存、应用实例复用和注册入口是否仍为旧值。
3. **有请求但返回旧 HTML**：排查 CDN、服务端部署和 HTTP 缓存。
4. **返回新 HTML 但页面仍旧**：排查脚本资源 URL、加载器缓存和应用挂载路径。

解决思路：

- 为子应用入口建立明确版本机制，如 `https://a.example.com/?version=2`，并确保**正在运行的主应用实际更新使用的入口配置**；
- 使用版本清单检测变更，必要时提示用户刷新主应用，或通过受控方式重新加载子应用；
- 对特定版本的加载器检查其缓存失效机制，不要假设每次路由切换都重新拉取 HTML；
- 不建议每次导航都无条件加随机时间戳破坏缓存。

**DNS 缓存不是 HTML 缓存**。清除 DNS 缓存通常无效；除非域名解析仍指向旧服务器等特殊情况。

## 评分

**72/100**。用户掌握 Proxy/fakeWindow 基本概念、HTML `no-cache` 与 hash 静态资源强缓存；未回答事件监听器清理机制，未识别 qiankun 运行时缓存，并误把 DNS 缓存当作入口资源缓存。

## 面试速记

- **沙箱**：限制普通全局属性污染。
- **副作用 patcher / 生命周期**：追踪或释放事件监听器等外部资源。
- **HTTP 缓存**：控制网络缓存如何验证和复用。
- **运行时缓存**：加载器在 JavaScript 内存中复用已加载的资源。
- **独立部署**：需要版本发现和更新策略，不能保证已打开页面自动升级。
