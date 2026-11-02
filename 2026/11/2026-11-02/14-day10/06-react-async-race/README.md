# Day 10 · Q6 — React 异步竞态、Effect cleanup 与状态一致性

**评分：75/100**

## 题目

```tsx
import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error("Failed to fetch user");
  return response.json();
}

function UserDetail({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(data => {
      setUser(data);
    });
  }, [userId]);

  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
```

用户先点击 A（请求耗时 3000ms），100ms 后点击 B（请求耗时 500ms）。B 在 600ms 返回，A 在 3000ms 返回。

问题：最终显示谁？如何防止过期结果覆盖新状态，并兼顾卸载？

## 参考答案

### 1. 最终显示 A

请求 B 先返回，执行 `setUser(B)`；请求 A 后返回，执行 `setUser(A)`。当前代码没有有效性校验，所以旧结果覆盖新结果。

### 2. 方案一：cleanup + ignore 标记

```tsx
useEffect(() => {
  // 每一次 Effect 执行都创建独立的闭包变量。
  // 旧请求和新请求不会共享这个 ignore。
  let ignore = false;

  // 避免保留旧用户详情作为当前用户的数据。
  // 注意：Effect 在提交后运行，渲染阶段还应校验 user.id。
  setUser(null);

  fetchUser(userId)
    .then(data => {
      // cleanup 已执行的请求不允许再更新状态。
      if (!ignore) {
        setUser(data);
      }
    })
    .catch(error => {
      // 旧请求的错误也不应污染当前用户的界面。
      if (!ignore) {
        console.error("Failed to fetch user:", error);
      }
    });

  // 依赖变化时，React 在下一次 Effect setup 前运行旧 cleanup；
  // 卸载时也会运行 cleanup。
  return () => {
    ignore = true;
  };
}, [userId]);
```

**为什么有效：** A 的 Effect 对应 `ignoreA`，切换 B 时 cleanup 把 `ignoreA` 改为 `true`；B 的 Effect 创建新的 `ignoreB=false`。A 即使最后返回，也不会调用 `setUser`。

**局限：** 旧请求仍可能消耗网络和服务端资源；只是忽略结果。

### 3. 方案二：AbortController

首先让请求函数支持 `AbortSignal`：

```tsx
async function fetchUser(
  id: number,
  signal: AbortSignal
): Promise<User> {
  // 将 signal 交给 fetch，使请求可以被主动取消。
  const response = await fetch(`/api/users/${id}`, { signal });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
}
```

然后在 Effect 中创建控制器：

```tsx
useEffect(() => {
  // 每次 Effect setup 都创建一个新控制器。
  const controller = new AbortController();

  setUser(null);

  fetchUser(userId, controller.signal)
    .then(data => {
      // 即使 Promise 回调已进入队列，也检查当前请求是否取消。
      if (!controller.signal.aborted) {
        setUser(data);
      }
    })
    .catch(error => {
      // 用户切换/卸载触发的主动取消不属于业务失败。
      if (controller.signal.aborted) return;
      console.error("Failed to fetch user:", error);
    });

  return () => {
    // 取消尚未完成的客户端 fetch；
    // 不保证服务端已接收的请求停止处理。
    controller.abort();
  };
}, [userId]);
```

对于不支持取消的异步任务，采用 cleanup 标记或请求序号校验。

### 4. 进阶：A → B → A 的 ABA 竞态

```text
t=0     A1 发出（慢）
t=100   B1 发出
t=200   A2 发出（快）
t=500   A2 返回，更新为新数据
t=3000  A1 返回，可能覆盖为旧数据
```

此时 `A1.data.id === userId` 仍然成立，因为当前用户又变成了 A。**请求参数相同不代表请求实例仍有效。**

因此不能仅使用 `data.id === userId` 判断是否允许更新。应根据 Effect 生命周期、请求 token/序号或取消信号判断。

### 5. 请求竞态与展示一致性是两个问题

即使过期请求被正确忽略，`userId` 改变后、Effect 清空状态前，渲染时仍可能暂时持有上一个用户的数据。

可以在渲染时额外校验：

```tsx
if (!user || user.id !== userId) {
  return <div>Loading...</div>;
}
```

这能避免把 A 的数据展示在 B 的详情界面，但**不能替代请求生命周期校验**，尤其不能解决 A → B → A 的 ABA 场景。

### 6. 生产注意事项

- 处理错误与加载态，避免请求失败时无限 Loading。
- 如果组件可能在 React Strict Mode 开发环境下重复执行 Effect setup/cleanup，正确的 cleanup 逻辑也能避免旧请求结果污染状态。
- 更复杂的缓存、去重、重试与数据同步场景，可以考虑专门的数据请求管理方案，但本题要求不引入第三方库。

## 评分说明

用户正确判断最终显示 A，也正确判断仅比较 `data.id === userId` 不能完全解决竞态；但没有独立完成修复代码，也没有解释 ABA 竞态原因。最终 **75/100**。
