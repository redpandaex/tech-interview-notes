# 第 11 天 · 第 8 题：React key 与组件状态保留机制

**评分：30/100**

## 题目

```tsx
function UserForm({ userId }: { userId: number }) {
  const [name, setName] = useState("");

  return (
    <div>
      <p>当前用户：{userId}</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>
  );
}

function App() {
  const [userId, setUserId] = useState(1);

  return (
    <>
      <button onClick={() => setUserId(id => id === 1 ? 2 : 1)}>
        切换用户
      </button>
      <UserForm userId={userId} />
    </>
  );
}
```

问题：

1. 输入 `Alice` 后切换用户，输入框会不会清空？为什么？
2. 如何让每次切换用户时重新初始化 `UserForm` 状态？为什么 `key` 有效？

## 一、正确答案

**不添加 key：输入框不会清空。**

切换 `userId` 时，`App` 和 `UserForm` 都可能重新渲染，但在相同的 UI 树位置，React 仍识别它是同一个 `UserForm` 组件，保留对应的 Hook 状态。

```text
首次：
UserForm（同一位置，未指定 key）
├── userId = 1
└── name = "Alice"

切换后：
UserForm（同一位置，未指定 key）
├── userId = 2
└── name = "Alice"  ← useState 状态被保留
```

### 函数组件重新执行 ≠ Hook 重新初始化

```tsx
const [name, setName] = useState("");
```

组件函数每次渲染都会重新执行这行代码，但 `useState` 的初始值只用于该组件身份的首次挂载。后续渲染会读取 React 保留的状态，不会因为 props 变化而自动重置。

## 二、使用 key 强制重置组件身份

```tsx
<UserForm key={userId} userId={userId} />
```

切换时：

```text
UserForm (key=1)
└── name = "Alice"

userId 改变：

UserForm (key=2)
└── name = ""  ← 新实例，重新初始化
```

React 在协调（reconciliation）过程中，通过元素的**位置、类型和 key** 判断组件是否保留身份。

- 同一位置、相同组件类型、相同 key：通常复用组件身份并保留状态。
- key 改变：旧组件身份不再匹配，新组件挂载，Hook 状态重置。
- 同一位置的组件类型改变：通常也会销毁旧状态并建立新状态。

**注意：**key 是相对于同一父级下的兄弟元素进行匹配的，并非全局唯一 ID。

### Effect 的行为

当 key 改变导致旧组件卸载、新组件挂载时：

- 旧组件对应 Effect 的清理函数会在相应阶段执行。
- 新组件重新建立 Effect。
- 在开发环境 React Strict Mode 下，还可能有用于检测副作用问题的额外执行行为；不要据此误判生产环境生命周期。

## 三、为什么列表需要稳定的 key？

```tsx
users.map(user => (
  <UserForm key={user.id} userId={user.id} />
))
```

列表中的 `key` 帮助 React 在插入、删除、排序时识别每一项的身份，避免将旧状态错误地复用到另一项上。

### 为什么不推荐随意用数组索引作 key？

```tsx
users.map((user, index) => (
  <UserForm key={index} userId={user.id} />
))
```

当列表发生插入或排序时，相同 index 可能对应不同用户；React 会把某个位置的旧组件状态错误地保留给新用户。对于确实不会重新排序、插入、删除的静态列表，索引 key 的风险相对较小。

### 为什么不能每次都用随机 key？

```tsx
<UserForm key={Math.random()} userId={userId} />
```

每次父组件重新渲染都会得到不同 key，导致子组件频繁卸载、重建，丢失状态并产生额外开销。

## 四、实际业务中的取舍

### 场景 A：编辑不同用户，切换时清空未保存草稿

使用：

```tsx
<UserForm key={userId} userId={userId} />
```

适合每个用户对应独立表单生命周期的场景。

### 场景 B：切换回来时需要恢复未保存草稿

不要依赖同一份本地状态或简单地改变 key。可把草稿提升到父组件或外部 store，以 `userId` 为键保存：

```ts
type Drafts = Record<number, { name: string }>;
```

然后根据当前用户读取相应草稿。

### 场景 C：需要保留组件其他状态，仅重置 name

可以明确在切换时更新对应状态，或重新组织状态归属；不应随意通过改变整个组件的 key 来重置全部状态。

## 五、常见误区

1. **props 变化不会自动重置 useState。**
2. **重新渲染不是重新挂载。**
3. **key 不只是列表警告的处理手段，也用于控制身份。**
4. **key 改变会重置该组件及其子树的本地状态，而非仅重置某个输入框。**
5. **key 不是传给组件的普通 props。** 如果组件内部需要 `userId`，仍需显式传入。

## 六、简短面试回答

> 不会清空，因为切换 userId 只是更新 props，UserForm 在相同位置、相同类型且 key 未变化，React 会保留它的 useState。若需要切换用户时重新初始化，写成 `<UserForm key={userId} userId={userId} />`。key 变化使 React 将其视为新组件，卸载旧实例并挂载新实例，内部状态重置。

## 七、评分依据

**30/100**。用户猜测切换用户后会清空，判断错误；对如何通过 key 重置组件状态回答“不知道”，要求讲解。主要需建立 React 组件身份与状态保留之间的联系。
