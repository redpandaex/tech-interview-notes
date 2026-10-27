# 第 4 天 · 第 3 题：React 搜索联想异步竞态与性能优化

日期：2026-10-28（第 4 天题目，沿用 2026-10-27 目录）｜状态：进行中，等待追问｜初步评分：**55/100**（非最终分）

## 题目

React SearchBox 有 keyword、results、loading 三个 state，在 useEffect([keyword]) 内 fetch(`/api/search?q=${keyword}`)，then setResults(data)、setLoading(false)，空关键词时 setResults([])。要求：
1. Code Review：快速输入、失败、清空、StrictMode。
2. 请求 A(a, 800ms)、B(ab, 500ms)、C(abc, 100ms) 乱序返回，如何避免旧结果覆盖。
3. 防抖/节流区别，搜索场景选择，防抖能否单独解决竞态。

## 参考答案

### 问题 1：代码缺陷

- `onChange={(e) => setKeyword(e.target.value)}` 的内联函数不是核心缺陷；提取函数不解决请求竞态，也不必机械添加 useCallback。
- 快速输入导致多个请求并发，响应完成顺序不等于发起顺序。旧响应可能覆盖最新结果，旧请求还可能错误地 setLoading(false)。
- fetch 网络失败或 response.json() 失败可能产生未处理的 Promise 拒绝，loading 不复位；**不必然导致 React 页面白屏**。fetch 对 HTTP 4xx/5xx 通常不会 reject，应检查 response.ok。
- 清空关键词时 setResults([]) 会清空显示，但旧请求若之后返回，仍可能重新填入结果；原代码未 setLoading(false)，可能残留加载状态。
- React StrictMode 在开发环境根级启用时会额外执行 Effect setup+cleanup 以暴露清理问题。初始 keyword 为空不会发请求，不能笼统说每次键入都请求两次；挂载时非空可能重复触发请求。Effect 必须正确清理定时器和请求。
- URL 参数需正确编码，例如 URLSearchParams。

### 问题 2：竞态

**方案一：ignore 标志位**

```tsx
useEffect(() => {
  if (!keyword) {
    setResults([]);
    setLoading(false);
    return;
  }

  let ignore = false;
  setLoading(true);

  fetch(`/api/search?q=${encodeURIComponent(keyword)}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: SearchResult[]) => {
      if (!ignore) setResults(data);
    })
    .catch(error => {
      if (!ignore) {
        console.error(error);
        setResults([]);
      }
    })
    .finally(() => {
      if (!ignore) setLoading(false);
    });

  return () => { ignore = true; };
}, [keyword]);
```

旧 Effect cleanup 后，旧请求即使返回也不更新状态。该方案不取消网络请求。

**方案二：AbortController**，为每次 Effect 创建 controller，将 signal 传给 fetch；cleanup 时 controller.abort()，并在处理成功/错误/finally 前检查 signal.aborted。客户端取消不保证服务器停止处理。也可用递增 requestId 判断结果是否过期。

### 问题 3：防抖与节流

- **防抖 Debounce**：持续触发就延迟，停止触发达到等待时间才执行（常用 trailing 方案）。普通搜索联想更适合防抖：快速输入 react 时通常只请求 react。
- **节流 Throttle**：在给定时间窗口内限制执行频率，适合滚动、鼠标移动等高频事件；leading/trailing 配置会影响具体执行时刻。
- 防抖只降低请求频率，**不能保证已发出的请求按顺序返回**，仍需取消或忽略过期响应。

### 综合示例

```tsx
import { useEffect, useState } from "react";

interface SearchResult {
  id: number;
  title: string;
}

function SearchBox() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = keyword.trim();

    if (!query) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    setResults([]);
    setError(null);
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query });
        const response = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data: SearchResult[] = await response.json();

        if (!controller.signal.aborted) setResults(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError("搜索失败，请稍后重试");
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [keyword]);

  return (
    <div>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        aria-label="搜索关键词"
      />
      {loading && <div>加载中...</div>}
      {error && <div role="alert">{error}</div>}
      <ul>
        {results.map(item => <li key={item.id}>{item.title}</li>)}
      </ul>
    </div>
  );
}
```

示例重点是异步竞态和清理；生产级联想还应考虑运行时数据校验、ARIA combobox、键盘交互、缓存等。

## 评分进度

初步评分 **55/100**，最终评分待追问结束后确定。

参考：
- https://react.dev/reference/react/useEffect
- https://react.dev/reference/react/StrictMode
- https://developer.mozilla.org/en-US/docs/Web/API/AbortController
