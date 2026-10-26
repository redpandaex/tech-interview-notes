# 跨框架 SDK 多实例隔离与生命周期 · 追问与答题记录

**状态：第一轮追问已回答；第二轮追问待答**

## 用户原始回答（原文）

> 1. 可以使用webcompnent的技术封装,让其装成一个普通的标签去使用,或者把他挂载到window上
>
> 我会设计一个SDK类,不会一开始挂载了就自动初始化,而是让作为一个类,必须实例化以后才能用,并且实例化以后可以注册相关的业务事件回调
>
> 2. 尽量不使用全局对象和样式等等
>
> AB理论上都不会互相影响吧会,但是假如说要设计成这种用户隔离的,在请求里面隔离开让后端根据这个token去判断
>
> 使用全局单例
>
> 3.了解
>
> 我使用的是库区封装的

## 初步点评

1. **正确**：可用 Web Components 自定义元素，或暴露命令式 SDK（也可 UMD 挂 `window`）；每个 `new OrderSDK(options)` 实例单独 `mount`，支持事件回调。实例化与 UI 挂载应分离；Web Components 与 SDK 可通过适配层组合。
2. **部分正确**：减少全局可变状态、请求按实例使用 Token 是正确方向。但“使用全局单例”如果共享可变身份、订单状态、弹窗或请求拦截器，会造成跨实例串扰；后端不能自动识别 A 请求误带 B 的有效 Token。需实例级认证上下文、React root、状态与资源所有权。
3. **未充分作答**：提到使用库封装，但未说明 Shadow DOM 的隔离边界。Shadow DOM 主要隔离 DOM/CSS 选择器，不自动隔离 JS 单例、网络请求、window 监听器、挂载到 body 的 Portal；CSS 继承属性和自定义属性仍可能跨边界。

## 第一轮追问（已答）

1. 假设 SDK 使用一个全局单例 `axios`，每个实例初始化时设置 `axios.defaults.headers.common.Authorization`。先创建 A(token-A)，再创建 B(token-B)，随后 A 请求计价。会出现什么问题？你会怎样修改 SDK 的请求层？
2. React 组件挂载在 Shadow DOM 中，但内部使用 `createPortal(modal, document.body)` 渲染弹窗。这个弹窗还受到 Shadow DOM 的样式隔离吗？你会如何调整？

## 第一轮追问：用户原始回答（原文）

> 1.1 token-B,只有一个axios实例,而且还是全局的,被替换了
> 1.2 创建多个axios,或者不使用这个axios,在sdk内部使用自己的axios
>
> 2.1不受,这个是挂载到了body上的
> 2.2使用modManager

### 第一轮点评及参考答案

1. **1.1 正确**：使用共享的 `axios.defaults.headers.common.Authorization`，创建 B 时覆盖 A 设置的 token；A 之后的请求使用 `token-B`。
2. **1.2 正确**：每个 SDK 实例通过 `axios.create({ headers: { Authorization: ... } })` 创建独立 HTTP Client，并使认证上下文、拦截器和请求控制器属于当前实例。共享 Axios 库的代码没有问题，共享可变默认配置才会串扰。注意共享 Cookie 等仍需单独考虑。
3. **2.1 正确**：`createPortal(modal, document.body)` 让弹窗实际 DOM 离开 Shadow Root，不再受到该 Shadow Root 的 CSS 选择器封装；React Context/React 事件树仍可保持。
4. **2.2 方向正确但不完整**：`ModalManager` 应是每个 SDK 实例独立的管理器；在各自 Shadow Root 内创建 `modalContainer`，Portal 挂载到该容器，销毁时仅清理当前实例资源。还需注意 body 滚动锁、焦点和层叠等跨实例共享资源的协调。

参考代码：

```ts
const http = axios.create({
  baseURL: "/api",
  headers: { Authorization: `Bearer ${token}` },
});
// 每个 SDK 实例创建独立 http
```

```tsx
const shadowRoot = host.attachShadow({ mode: "open" });
const appContainer = document.createElement("div");
const modalContainer = document.createElement("div");
shadowRoot.append(appContainer, modalContainer);
createRoot(appContainer).render(
  <OrderApp portalContainer={modalContainer} />
);
// OrderApp 内部：createPortal(<OrderModal />, portalContainer)
```

## 第二轮追问（待答）

**问题 1：异步计价请求竞态**。用户快速依次输入数量 1、2、3，SDK 发起 R1、R2、R3。响应顺序却是 R3、R1、R2。如何确保最终界面只展示数量 3 的报价？仅调用 `AbortController.abort()` 是否足够？为什么？

**问题 2：destroy 生命周期**。R1 请求未返回，宿主执行 `sdk.destroy()`，随后 R1 才返回。你会如何实现 `destroy()`，保证 React 不会再被更新、请求和事件监听器被清理，并且连续调用两次 `destroy()` 不报错？

## 评分

待第二轮追问后评定。

## 评分

待追问结束后评定。
