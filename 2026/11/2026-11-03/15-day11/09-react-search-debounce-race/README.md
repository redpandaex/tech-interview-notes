# 第 11 天 · 第 9 题：搜索防抖与异步请求竞态

**得分：95/100**

## 题目

```tsx
function Search() {
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!keyword) return;

    fetch(`/api/search?q=${encodeURIComponent(keyword)}`)
      .then((res) => res.json())
      .then((data) => console.log(data));
  }, [keyword]);

  return (
    <input
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
    />
  );
}
```

1. 用户快速输入 react，可能产生什么问题？使用防抖还是节流，为什么？
2. 即使使用防抖，异步响应仍可能出现什么问题？如何解决？

## 一、为什么搜索输入适合防抖

原实现每次输入改变 `keyword`，Effect 都会运行，可能为 `r`、`re`、`rea`、`reac`、`react` 分别发起请求，导致无效请求、带宽浪费、服务端压力以及竞态问题。

- **防抖（debounce）**：持续触发时推迟执行，直到最后一次触发后经过指定安静时间才执行。适合搜索建议、输入校验等希望在用户暂时停止输入后处理的场景。
- **节流（throttle）**：在持续触发时限制执行频率，适合滚动、拖拽、位置采样等需要持续反馈的场景。

搜索并非必须永远使用防抖：如果产品要求实时提示，也可以采用短防抖、缓存、并发控制等组合。

## 二、防抖为什么不能解决异步竞态

```text
t=0ms    请求 A（react）发出
t=500ms  请求 B（react hooks）发出
t=600ms  B 返回，显示新结果
t=900ms  A 返回，覆盖新结果  ← 竞态
```

**防抖控制何时发请求，不能保证请求何时返回。**

### 方案一：AbortController + Effect cleanup

```tsx
useEffect(() => {
  if (!keyword) return;

  const controller = new AbortController();

  async function search() {
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(keyword)}`,
        { signal: controller.signal },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // 取消后不提交旧数据，防止旧结果覆盖新结果。
      if (!controller.signal.aborted) {
        setResults(data);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
    }
  }

  void search();

  // 依赖改变、组件卸载时清理旧请求。
  return () => controller.abort();
}, [keyword]);
```

`AbortController` 通过 `signal` 将取消请求传给 `fetch`；Effect 清理在下一次 Effect 生效前执行，也会在卸载时执行。提交结果前检查 `signal.aborted`，可保护后续异步处理阶段。注意：取消前请求可能已经到达服务端，`abort()` 不意味着服务端一定停止处理。

### 方案二：请求版本号 / 过期标志

若底层异步 API 不支持取消，或想在客户端明确保证“只接受最新结果”，可以维护版本号：

```tsx
const requestIdRef = useRef(0);

useEffect(() => {
  const requestId = ++requestIdRef.current;

  if (!keyword) {
    setResults([]);
    return;
  }

  fetch(`/api/search?q=${encodeURIComponent(keyword)}`)
    .then((res) => res.json())
    .then((data) => {
      // 只有最新请求有权提交结果。
      if (requestId === requestIdRef.current) {
        setResults(data);
      }
    })
    .catch(console.error);

  return () => {
    // 使当前请求结果失效，包括卸载场景。
    if (requestId === requestIdRef.current) {
      requestIdRef.current++;
    }
  };
}, [keyword]);
```

请求序号不能节省已发送请求的网络资源，但能避免过期结果覆盖新结果。对于一般 `fetch` 场景，AbortController 已经很合适。

## 三、组合实现：防抖 + 取消旧请求

```tsx
function Search() {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [results, setResults] = useState<unknown[]>([]);

  // 第一步：只在用户停止输入 300ms 后更新搜索词。
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  // 第二步：每个已防抖的搜索词对应一轮可取消请求。
  useEffect(() => {
    if (!debouncedKeyword) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedKeyword)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!controller.signal.aborted) setResults(data);
      } catch (error) {
        if (!controller.signal.aborted) console.error(error);
      }
    }

    void load();
    return () => controller.abort();
  }, [debouncedKeyword]);

  return (
    <>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </>
  );
}
```

**边界提醒：**上述实现仅在 `debouncedKeyword` 变化时取消旧请求。因此在原始 `keyword` 已变化、但 300ms 防抖窗口尚未结束时，旧请求仍可能短暂更新页面。若产品要求输入一改变就禁止旧结果覆盖，应在原始 `keyword` 变化时立即使旧请求失效，或使用“提交结果时与当前输入比对”的校验机制。

例如，维护最新输入的 ref：

```tsx
const latestKeywordRef = useRef(keyword);
latestKeywordRef.current = keyword;

// 收到结果时：
if (
  !controller.signal.aborted &&
  latestKeywordRef.current === debouncedKeyword
) {
  setResults(data);
}
```

## 四、工程实践补充

- 避免把 `AbortError` 当成真正请求失败提示给用户。
- `fetch` 对 HTTP 4xx/5xx 通常不会自动 reject，需要检查 `response.ok`。
- 对空关键词清空结果、取消旧请求；对加载态、错误态、缓存命中等要有明确 UI 设计。
- 对高频搜索可结合缓存、请求去重、服务端限流和分页。
- 如果用 React Query / TanStack Query 等数据请求库，应理解它们的缓存、失效与取消语义，而不是仅依赖库名。

## 五、面试标准回答

> 连续输入会触发多次请求，既浪费资源又可能出现旧响应覆盖新结果。搜索输入通常使用防抖，在用户停止输入一段时间后发请求。防抖无法保证响应顺序，所以用 AbortController 在关键词改变或组件卸载时取消旧请求，并在更新状态前检查是否已取消；也可以使用请求序号确保只接受最新结果。

## 六、评分依据

**95/100**。用户正确选择防抖并指出输入结束后触发的目的，正确识别请求响应乱序引起的竞态，提出 AbortController 解决方案。小幅扣分在于未明确指出频繁请求本身的开销及取消时机；`ControllerAbort` 是名称笔误。
