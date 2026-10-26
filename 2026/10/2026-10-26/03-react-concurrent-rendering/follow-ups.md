# React Suspense、并发渲染与 Transition · 追问与答题记录

**状态：主问题已回答，第一轮追问待答**

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

## 第一轮追问（待答）

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
