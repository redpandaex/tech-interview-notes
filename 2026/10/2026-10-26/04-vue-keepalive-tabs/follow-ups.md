# Vue KeepAlive 与多标签缓存 · 追问与答题记录

**状态：第一轮追问已完成，第二轮追问待答**

## 用户原始回答（原文）

> 1.
> 貌似是缓存了组件的实例
> 2.
> 挂载,卸载激活失活
> 3.
> 正常引入这个组件就行了吧,没太看懂

## 初步点评

1. **正确**：`KeepAlive` 缓存组件实例与 VNode，并保留相关 DOM 以便恢复，而不只是缓存 HTML。
2. **名称正确，触发时机未展开**：首次挂载 `mounted` 和 `activated`；离开缓存组件 `deactivated`；重新激活仅 `activated`；真正卸载才 `unmounted`。最终卸载缓存组件也会触发 `deactivated`。
3. **尚未理解**：同一路由组件 `CustomerDetail` 可能用于 `/customer/1001` 与 `/customer/1002`，Vue Router 会复用相同组件实例。要让不同客户详情页分别缓存表单状态，可通过 `:key` 区分业务实例。

## 讲解示例

```vue
<RouterView v-slot="{ Component, route }">
  <KeepAlive :max="10">
    <component :is="Component" :key="route.fullPath" />
  </KeepAlive>
</RouterView>
```

- `route.fullPath` 可区分不同路由地址，但包含 query，可能导致过多缓存。
- 更稳定的方案可以按业务标识生成 `key`，例如 `route.name + ':' + route.params.id`，具体取决于业务语义。
- `max` 是缓存上限，超过上限时按最近最少使用策略淘汰，不等于关闭某个业务 Tab 就自动移除其缓存。
- 即使不使用 key，也可通过 watch 路由参数更新数据，但如果要保留每个客户独立表单状态，独立 key 通常更合适。

## 第一轮追问（已答）

有两个详情页：

- `/customer/1001`：客户 A
- `/customer/1002`：客户 B

两者都渲染 `CustomerDetail`，使用 `KeepAlive`。

1. 如果希望两个客户的表单草稿分别保留，你会给组件设置什么 `key`？
2. 从 A 切换到 B，再切回 A，A 第二次出现时通常会触发 `mounted` 还是 `activated`？



## 评分

待追问结束后评定。

## 第一轮追问：用户原始回答

> 不同的key吧,这两个实例不能冲突
> activated,

### 评价

- 两问均正确。对不同客户使用不同业务 `key`，例如 `route.name + ':' + route.params.id`，避免同一组件或其他路由缓存实例冲突。
- 缓存实例再次进入触发 `activated`，通常不再触发 `mounted`；在 `mounted` 中请求数据不会因为激活自动重跑。

## 第二轮追问（待答）

订单列表被 KeepAlive 缓存，`onMounted` 中通过 `setInterval` 每 5 秒执行任务，`onUnmounted` 中 `clearInterval`。

1. 从订单列表切换到其他缓存页，进入 `deactivated` 后，定时器是否仍执行？为什么？
2. 希望离开时暂停、返回时恢复，应使用哪两个生命周期？

等待用户回答，不提前公布标准答案。
