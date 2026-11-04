# 第 12 天 · 第 1 题：React Select 组件库设计——受控与非受控

**难度：L2 中高级业务实践**  
**最终评分：55/100**（问题分析 22/30，解决方案 12/40，原理理解 15/20，边界意识 6/10）

## 一、题目

为内部 React 组件库实现 `Select`，支持两种使用方式：

```tsx
// A：受控
function App() {
  const [value, setValue] = useState("react");
  return <Select value={value} onChange={setValue} options={options} />;
}

// B：非受控
function App() {
  return (
    <Select
      defaultValue="react"
      onChange={(value) => console.log(value)}
      options={options}
    />
  );
}
```

业务反馈：A 中选择新选项后有时仍显示旧值；B 中父组件修改 `defaultValue` 后，选中值不变。

1. 如何区分受控/非受控？选择新选项后如何处理状态？
2. B 中 `defaultValue` 变化但未更新选中值是 Bug 吗？

**第一次追问：** `<Select value="react" onChange={console.log} />`，用户选择 Vue 后最终显示什么？  
**第二次追问：** 受控与非受控模式是否调用内部 `setValue`？是否都触发 `onChange`？

## 二、核心答案

| 维度 | 受控组件 | 非受控组件 |
|---|---|---|
| 当前值来源 | 父组件的 `props.value` | 组件自身的 state |
| `defaultValue` | 通常不参与当前值控制 | 首次挂载时提供初始值 |
| 用户选择后 | 通知父组件，等待新的 `value` | 更新内部 state，并通知父组件 |
| 是否调用内部 `setValue` | 不需要 | 需要 |
| 是否触发 `onChange` | 是（发生有效选择变化时） | 是（发生有效选择变化时） |

`onChange` 和 `onSelect` 是 API 命名与语义约定，不是受控/非受控的决定因素。部分组件库会同时提供两者，语义可能不同（例如 `onSelect` 表示选中操作，`onChange` 表示值变化）。

### 受控值写死的例子

```tsx
<Select
  value="react"
  onChange={(next) => console.log(next)}
  options={[
    { label: "React", value: "react" },
    { label: "Vue", value: "vue" },
  ]}
/>
```

点击 Vue 会打印 `vue`，但最终仍显示 React：父组件没有更新 `value`。这是受控组件的预期行为。

### `defaultValue` 更新为什么无效？

```tsx
const [internalValue, setInternalValue] = useState(defaultValue);
```

`useState` 的初始值只在组件初次挂载时用于初始化。父组件后续改变 `defaultValue`，不会自动覆盖内部 state。这是非受控模式的常规语义，而不是 Bug。

若确实要强制重置，可在父组件改变 `key` 触发重新挂载；或组件库提供明确的重置 API。若希望随父组件更新，应使用受控 `value`。

## 三、可运行思路：简化版 Select

```tsx
import { useState } from "react";

type Option = { label: string; value: string };

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: Option[];
}

export function Select({
  value,
  defaultValue,
  onChange,
  options,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);

  // 简化契约：传入非 undefined 的 value 即为受控
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;

  function handleSelect(nextValue: string) {
    if (nextValue === selectedValue) return;

    // 只有非受控模式由组件内部维护状态
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    // 无论哪种模式，均通知外部值发生了变化
    onChange?.(nextValue);
  }

  return (
    <div role="listbox" aria-label="Framework">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={selectedValue === option.value}
          onClick={() => handleSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

上例只展示**状态控制机制**，不代表完整可访问的 Select：正式组件还需键盘导航、焦点管理、禁用态、ARIA 关联、弹层行为、组合输入等。

### 可复用的状态控制 Hook

```tsx
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value: T | undefined;
  defaultValue: T;
  onChange?: (next: T) => void;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  function setValue(next: T) {
    if (Object.is(next, currentValue)) return;
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  }

  return [currentValue, setValue] as const;
}
```

实际生产代码还需考虑 `undefined` 是否为合法受控值、切换模式时的告警、受控回调中的异步更新、重复事件与函数式更新等契约。可通过明确的 `value` 存在性判断或 API 限制控制模式，但必须统一组件库约定。

## 四、边界条件与工程设计

1. **不要在受控模式中偷偷更新显示值。** 否则组件 UI 与 `props.value` 不一致，容易出现闪烁或回退。
2. **避免运行时切换受控/非受控模式。** React 表单生态通常不鼓励这样做；组件库可在开发环境提示。
3. **不要把 `defaultValue` 当成可持续同步的值。** 需要同步就用 `value`。
4. **`onChange` 不属于受控模式专属。** 非受控组件也可以通知业务层保存、校验或埋点。
5. **不要混淆 `useImperativeHandle`。** 它用于通过 ref 暴露 `focus()`、`clear()` 等命令式操作，不能替代内部状态管理或事件通知。
6. **区分 `onSelect` 与 `onChange`。** 是否两者都提供取决于组件库 API 设计；不能仅靠改回调名解决受控状态问题。

## 五、用户回答分析

- 正确指出 `defaultValue` 只在初始化时起作用。
- 正确判断 `value="react"` 写死时，选择 Vue 后仍显示 React。
- 误以为受控模式应该更新内部 state、非受控不应该更新；实际相反。
- 误以为 `onChange` 只用于受控模式；实际两种模式都可触发。
- 记起 `useImperativeHandle` 的概念，但把命令式 ref 与非受控状态混为一谈。

## 六、面试精简回答

> 组件是否受控取决于当前值由谁管理。受控模式以 `value` 为唯一可信来源，选择后调用 `onChange`，由父组件更新 `value`；非受控模式用 `defaultValue` 初始化内部 state，选择后更新内部 state 并同样触发 `onChange`。因此 `defaultValue` 后续变化不会自动覆盖内部选中值。组件库还需约定模式切换、值比较、禁用态和重置行为。
