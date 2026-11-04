# 第 12 天 · 第 9 题：React 异步搜索竞态、AbortController 与 Request ID

**方向：React / 异步请求 / 状态管理**  
**难度：L2**  
**最终评分：86/100**

## 一、题目

用户搜索组件在关键词变化时发请求：

```tsx
import { useEffect, useState } from "react";

function UserSearch() {
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!keyword) {
      setUsers([]);
      return;
    }

    fetch(`/api/users?keyword=${encodeURIComponent(keyword)}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
      });
  }, [keyword]);

  return (
    <>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </>
  );
}
```

用户先输入 `react`，随后输入 `vue`：

```text
t0 发送 A（react），耗时 800ms
t1 发送 B（vue），耗时 100ms
t2 B 先返回 → setUsers(vueUsers)
t3 A 后返回 → setUsers(reactUsers)
```

主问题：
1. 为什么输入框显示 vue，列表却可能显示 react？
2. 如何修复？300ms 防抖是否足够？
3. 清空输入框后旧请求返回，会出现什么？

追问：
1. 不取消请求，仅使用 Request ID 如何保证只有最新响应更新状态？清空关键词是否也要递增序号？
2. A、B 并发时，A 先完成并在 finally 中执行 `setLoading(false)`，但 B 还在运行，会出现什么问题？如何修复？

## 二、问题本质：异步竞态（Race Condition）

Promise / fetch 不保证响应按照请求发送顺序返回。原始代码每次请求完成都无条件调用 `setUsers`，导致旧请求的结果覆盖新请求。

**注意：** 用户在主问题中说“B 请求比较长”，但题目实际上是 **A（react）耗时更长**。核心概念仍然正确。

搜索框状态和结果状态由不同逻辑更新，因此可能出现 `keyword === "vue"`，但 `users` 是 react 的搜索结果。

## 三、方案一：AbortController + Effect 清理

```tsx
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
}

function UserSearch() {
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 空关键词时不再展示旧结果
    if (!keyword.trim()) {
      setUsers([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function search() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/users?keyword=${encodeURIComponent(keyword)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: User[] = await res.json();

        // 请求已经失效就不更新结果
        if (!controller.signal.aborted) {
          setUsers(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "搜索失败");
        }
      } finally {
        // 旧请求不能关闭新请求的 loading
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void search();

    // keyword 变化或组件卸载时执行清理
    return () => controller.abort();
  }, [keyword]);

  return (
    <div>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜索用户"
      />
      {loading && <p>加载中...</p>}
      {error && <p role="alert">{error}</p>}
      {users.map((user) => <div key={user.id}>{user.name}</div>)}
    </div>
  );
}
```

关键点：

- 每个 Effect 实例创建自己的 `AbortController`。
- 当 keyword 改变时，React 执行旧 Effect 的 cleanup，调用 `abort()`，然后运行新 Effect。
- 在异步成功、失败和 finally 中都检查 `signal.aborted`，避免旧任务更新数据、错误或 loading。
- 组件卸载时也会执行 cleanup。
- Abort 是客户端取消等待或消费请求的机制，不保证服务器端已开始的处理一定停止。

## 四、方案二：Request ID / 版本号

无法取消请求时，可以使用一个单调递增序号，只接受最新版本的结果。

```tsx
import { useEffect, useRef, useState } from "react";

interface User {
  id: string;
  name: string;
}

function UserSearch() {
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    // 包括清空关键词在内，每次 keyword 变化都让旧请求失效
    const requestId = ++requestIdRef.current;

    if (!keyword.trim()) {
      setUsers([]);
      setLoading(false);
      setError(null);
      return;
    }

    async function search() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/users?keyword=${encodeURIComponent(keyword)}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: User[] = await res.json();

        if (requestId === requestIdRef.current) {
          setUsers(data);
        }
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : "搜索失败");
        }
      } finally {
        // 只允许当前最新请求结束 loading
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    void search();

    // 卸载或依赖变化时，立即让本次请求失效
    return () => {
      if (requestIdRef.current === requestId) {
        ++requestIdRef.current;
      }
    };
  }, [keyword]);

  return (
    <div>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      {loading && <p>加载中...</p>}
      {error && <p role="alert">{error}</p>}
      {users.map((user) => <div key={user.id}>{user.name}</div>)}
    </div>
  );
}
```

这里 `requestIdRef` 不需要 `nanoid`：递增整数已经足够用于同一个组件实例内的新旧请求比较。若有跨进程、分布式等标识需求，才需要另外考虑全局唯一 ID。

**为什么清空时也要递增？** 因为清空不是“什么都不做”，而是一次新的搜索状态变化。它必须使所有此前请求的结果失效，避免输入框为空却重新显示旧列表。

## 五、第二次追问：loading 也会发生竞态

错误代码：

```tsx
async function search(keyword: string) {
  setLoading(true);
  try {
    const data = await fetchUsers(keyword);
    setUsers(data);
  } finally {
    setLoading(false);
  }
}
```

当请求 A 先结束、请求 B 仍在运行时，A 的 finally 会错误地把 loading 设为 false。

**具体 UI 表现：** 加载动画提前消失、提交按钮过早恢复可点击，甚至在新请求未完成时错误展示空状态。

正确写法：

```tsx
const requestId = ++requestIdRef.current;

try {
  const data = await fetchUsers(keyword);
  if (requestId === requestIdRef.current) {
    setUsers(data);
  }
} catch (error) {
  if (requestId === requestIdRef.current) {
    setError(String(error));
  }
} finally {
  if (requestId === requestIdRef.current) {
    setLoading(false);
  }
}
```

**核心：** 请求版本判断不仅用于 `data`，也应保护 `loading`、`error`、`pagination` 等所有异步派生状态。

## 六、防抖为何不能彻底解决？

防抖只限制“何时发出请求”，不保证“哪次请求先返回”。

即使每次输入停顿 300ms 才请求，仍可能：

```text
用户输入 react，停顿 300ms → 发 A
用户修改为 vue，停顿 300ms → 发 B
B 先返回，A 后返回 → 仍有竞态
```

实际项目常组合：
- 防抖：减少无意义请求频率。
- AbortController：取消不再需要的请求。
- Request ID / Effect 生命周期标记：防止过期结果更新 UI。
- 缓存库（如 TanStack Query）：处理缓存、请求状态和查询键，但仍应理解其请求键和取消语义。

## 七、常见边界

1. **清空关键词**：立即清空数据，关闭 loading，并使旧请求失效。
2. **组件卸载**：清理旧请求或标记旧版本失效。
3. **HTTP 错误**：fetch 对 404/500 不会自动 reject，需检查 `res.ok`。
4. **取消异常**：AbortError 不应当作普通业务错误展示。
5. **搜索结果和关键词不匹配**：可额外维护 `resultKeyword` 或请求版本，明确结果对应的搜索条件。
6. **loading 和 error 竞态**：任何异步状态都应受同一“最新请求”约束。
7. **StrictMode 开发模式**：Effect 可能额外经历 setup/cleanup，用于暴露清理逻辑缺陷。
8. **请求发送与取消**：Abort 不保证服务端未执行或停止执行，尤其对有副作用的写接口仍需服务端幂等。

## 八、面试简答模板

> 这是异步请求竞态：较早发出的请求可能较晚返回，旧结果覆盖新结果。可以在 useEffect 中创建 AbortController，并在 cleanup 中 abort 上一次请求；或者使用 useRef 维护递增 requestId，只让最新请求更新状态。防抖只能减少请求次数，不能保证响应顺序。用户清空关键词时也必须让旧请求失效。除了结果列表，loading、error 等状态也必须加相同的版本判断，否则旧请求结束可能提前关闭新请求的加载动画。

## 九、评分

| 维度 | 得分 |
|---|---:|
| 问题分析 | 26/30 |
| 解决方案 | 35/40 |
| 原理理解 | 17/20 |
| 边界意识 | 8/10 |
| **总分** | **86/100** |

用户掌握 AbortController、Request ID、清空时旧请求失效等关键点；第二次追问中误将 loading 提前关闭的后果描述为“显示错误数据”，需加强异步 UI 状态一致性。
