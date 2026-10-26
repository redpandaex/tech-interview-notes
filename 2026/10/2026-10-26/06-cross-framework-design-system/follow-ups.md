# 跨技术栈组件库与设计系统治理 · 追问与答题记录

**状态：第一轮追问已回答，第二轮追问待答**

## 用户原始回答（原文）

> 1. DesignToken是可以划分的吗?如果是统一设计的话,我会设计相关的主题色,次要按钮颜色,通知样式等等,基础组件包括如通知组件/弹窗组件/然后还有一些分页之类的等等/业务组件比如Header和foooter以及侧边栏等等
>
> 框架适配层我会用来打包分发组件库的组件,这里适合用来对接不同的项目
>
> 2. 不能,可以打包成webcomponent或者使用sdk的方案,挂载到某个容器节点上,暴露一些回调出来
> 3. 了解一些,因为这个不需要考虑框架可以将其视为普通地方html标签组件,局限有点忘记了

## 初步点评

### 1. Design Token、基础组件与业务组件

- Design Token 可按 **Primitive（原始值）→ Semantic（语义）→ Component（组件级）** 分层，例如 `color-blue-500`、`color-primary`、`button-primary-bg`；还包括字号、间距、圆角、阴影、动效等，不止主题色。
- 基础组件包括 Button、Input、Modal、Pagination、Notification 等，与具体业务数据解耦。
- 业务组件以**业务耦合程度**划分，例如 CustomerSelector、ApprovalFlow、PermissionButton；Header、Footer、Sidebar 可能是通用布局，也可能是业务组件，取决于是否包含业务逻辑。
- 框架适配层主要处理 props、事件、slots/children、生命周期、类型等不同框架差异；打包发布属于构建/发布层，不能混为一谈。

### 2. 跨框架复用

- 用户提出 **Web Components** 或 **SDK 挂载到容器并暴露回调**，两种方向均正确。
- React 组件不能直接作为 Vue 2 或 NEJ 的原生组件使用；Web Component 需要适当包装或重写，不是简单打包即可。
- SDK 挂载可在旧系统中使用，但要考虑 React 运行时、包体积、实例隔离、destroy 清理。

### 3. Web Components 的边界

- Custom Elements 定义自定义元素；Shadow DOM 提供 DOM/样式封装；HTML Templates 提供可复用模板。
- Shadow DOM 默认阻隔外部普通 CSS 选择器，需设计 CSS 变量、`::part` 等主题入口。
- 需要处理 CustomEvent、属性与 JS property、表单、SSR、旧浏览器及框架集成边界。

## 第一轮追问（已答）

公司提供一个基于 Web Components 的按钮：

```html
<company-button variant="primary">提交</company-button>
```

按钮内部使用 Shadow DOM，向外派发 `CustomEvent("confirm", { detail: { id: 123 } })`。

1. Vue 2 或 NEJ 项目如果想更改按钮内部的背景色，直接写 `company-button button { background: red }` 能生效吗？为什么？你会提供什么主题定制接口？
2. 宿主应用如何获取 `confirm` 事件携带的 `id`？请说出一个原生 JS 方案。

## 第二轮追问（待答）

如果组件不是在 custom element 宿主节点上派发事件，而是在 Shadow DOM **内部的 button 元素**上派发：

```ts
button.dispatchEvent(new CustomEvent('confirm', { detail: { id: 123 } }));
```

宿主代码使用 `document.querySelector('company-button')?.addEventListener('confirm', handler)` 是否一定能收到？如果不能，创建 `CustomEvent` 时还应配置什么选项？

## 第一轮追问：用户原始回答

> 1. 不能,webcomponent内部德阳市不会被外部css修改,我会给这个组件提供一个或者多个属性,让外部调用来调整样式
> 2. 使用addEventListener?

### 评价与补充

- **第 1 问正确**：Shadow DOM 的普通内部节点无法通过外部 `company-button button` 选择器匹配；组件可以提供 `variant`、`size` 等 Attribute/Property 控制样式。还可提供可继承的 CSS 自定义属性 `--company-button-bg` 或通过 `part="button"` + `::part(button)` 暴露定制入口。注意 Web Components 不等于必然使用 Shadow DOM。
- **第 2 问正确但未展开**：原生 `addEventListener('confirm', handler)` 可以监听派发在宿主自定义元素上的 `CustomEvent`；通过 `event.detail.id` 获取数据。

```ts
const el = document.querySelector('company-button');
el?.addEventListener('confirm', (event) => {
  const { id } = (event as CustomEvent<{ id: number }>).detail;
  console.log(id);
});
```

**补充区别**：事件如果从 Shadow DOM 内部元素派发，是否能穿过 Shadow Boundary 还取决于 `bubbles` 和 `composed` 等事件配置。

## 评分

待第二轮追问后评定。
