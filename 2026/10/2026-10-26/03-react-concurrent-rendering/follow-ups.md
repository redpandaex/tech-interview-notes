# React Suspense、并发渲染与 Transition · 追问与答题记录

**状态：第一轮追问已回答并讲解，待确认理解**

## 用户原始回答（原文）

> 1. 知道,一个是让在后台渲染ui一个是提前更新UI,但是我这边用的好像比较少
> 2. 不是,react并发渲染,主要是指的schduler的调度,会在浏览器空闲的时候去执行
> 3. 不一定
> 4.

说明：原始问题只包含三问，用户最后的“4.”未附内容，不据此虚构回答。

## 面试官初评

1. `useTransition` 与 `useDeferredValue` 的方向接近但描述不准确：前者将某些状态更新标记为非紧急，后者允许值的更新延后。均不代表后台线程。
2. 并发渲染不等于 JS 多线程；Scheduler 的优先级调度与让出主线程是重点，但不是“只在浏览器空闲时执行”。
3. 组件函数执行完不一定 Commit DOM：Render 阶段可能被中断、重做或放弃，Commit 阶段才提交 DOM。
4. 本题尚未完成，暂不做最终评分。

## 第一轮追问（已答）

```tsx
function SearchPage() {
  const [keyword, setKeyword] = useState("");
  return (
    <>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      <HeavyList keyword={keyword} />
    </>
  );
}
```

假设 `HeavyList` 渲染 5000 条数据。

1. 优先选择 `useTransition` 还是 `useDeferredValue`？为什么？
2. 若 `HeavyList` 内部每次都有 800ms 同步计算，`useDeferredValue` 能否彻底解决卡顿？结合 Long Task 说明。

## 第二轮追问（如有）

待第一轮回答后决定；最多两轮。

## 第一轮追问：用户原话

> 1. useDeferredValue其实我还是有一点搞不懂这两个都区别,你能划分出来看一下吗
> 2. 不能,这个只是延后呀,最好是用切片或者换成worker里面执行

### 点评与补充讲解

- 第 2 问正确：`useDeferredValue` 不能自动将 800ms 同步计算切片或移到其他线程；可考虑主线程任务切片或 Web Worker。
- 第 1 问用户明确表示尚未理解，因此先解释，不据此给最终评分。
- `useTransition`：有权调用 `setState` 时，将某次状态更新标记为非紧急；可用 `isPending` 表示过渡待处理。
- `useDeferredValue`：接收一个已经存在的值，让使用该值的 UI 在紧急更新中暂时保留旧值，随后以可中断的后台渲染追赶新值；无需另设第二个 state。
- 典型对比：`setInput(value); startTransition(() => setQuery(value))` vs `const deferredInput = useDeferredValue(input)`。
- `useDeferredValue` 不是 debounce，没有固定延迟；若慢列表作为子组件，为避免父组件紧急渲染时仍执行慢列表，通常还需配合 `React.memo`。
- `startTransition` 回调本身立即执行，降低优先级的是其中调度的 React 状态更新，并不是将任意同步计算放到后台线程。
- 官方文档：https://react.dev/reference/react/useTransition 和 https://react.dev/reference/react/useDeferredValue

**状态：待用户确认理解后再进行下一轮追问或结束。**
