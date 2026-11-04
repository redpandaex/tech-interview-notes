# 第 12 天 · 第 3 题：React Table 跨页多选与组件 API 设计

**方向：组件库 / React / 服务端分页**  
**难度：L2 中高级业务实践**  
**最终评分：86/100**

## 题目

你负责一个支持服务端分页的订单管理 Table。每页 20 条，用户可以跨页勾选订单并批量删除。现有代码把完整的 row 对象保存在 `selectedRows` 中：

```tsx
function OrderTable({ data }) {
  const [selectedRows, setSelectedRows] = useState([]);

  function handleSelect(row) {
    setSelectedRows((prev) => [...prev, row]);
  }

  return (
    <Table
      dataSource={data}
      selectedRows={selectedRows}
      onSelect={handleSelect}
    />
  );
}
```

要求：

1. 第一页勾选 3 条，翻到第二页继续勾选，第一页选择不能丢。
2. 其他用户可能修改订单，保存的完整 row 对象可能已经过期。
3. 设计通用 Table API，支持指定唯一 ID、受控选中和跨页保留。
4. 第二页全选/取消全选时，不能影响其他页面的选择。

## 一、核心数据结构

推荐维护**跨页的稳定主键集合**：

```tsx
const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(
  () => new Set(),
);
```

优点：

- **跨页独立于当前数据源**：切换页面只替换 `dataSource`，不会丢失全局选择。
- **避免保存过期 row 对象**：只保存 ID，执行操作前可重新查询或由后端校验。
- **去重**：Set 不会重复保存同一个 ID。
- **查询效率**：`selectedRowKeys.has(id)` 平均接近 O(1)。

不要把 `currentPageSelection` 和全局 `selectedRowKeys` 维护为两份独立可写状态，容易出现同步问题。当前页选择应从全局状态和当前页数据**派生**：

```tsx
const currentPageSelection = dataSource.filter((row) =>
  selectedRowKeys.has(row.id),
);
```

如果业务需要保留当前页选中 ID，可以派生：

```tsx
const currentPageSelectedKeys = dataSource
  .filter((row) => selectedRowKeys.has(row.id))
  .map((row) => row.id);
```

## 二、全选和取消全选的正确实现

初始状态：

```ts
const selectedRowKeys = new Set(["101", "102", "201"]);

const currentPageRows = [
  { id: "201" },
  { id: "202" },
  { id: "203" },
];
```

**第二页全选：对全局 Set 做并集。**

```tsx
setSelectedRowKeys((previous) => {
  const next = new Set(previous);
  currentPageRows.forEach((row) => next.add(row.id));
  return next;
});
// Set { "101", "102", "201", "202", "203" }
```

**第二页取消全选：只移除当前页 ID。**

```tsx
setSelectedRowKeys((previous) => {
  const next = new Set(previous);
  currentPageRows.forEach((row) => next.delete(row.id));
  return next;
});
// Set { "101", "102" }
```

**注意 React 状态不可变更新：** 不要直接修改旧 Set 并传回同一个引用；应创建新 Set，保证 React 能观察到状态变化。

### 部分选中（indeterminate）

```tsx
const selectableKeys = currentPageRows
  .filter((row) => !row.disabled)
  .map((row) => row.id);

const selectedCount = selectableKeys.filter((key) =>
  selectedRowKeys.has(key),
).length;

const allSelected =
  selectableKeys.length > 0 && selectedCount === selectableKeys.length;

const indeterminate =
  selectedCount > 0 && selectedCount < selectableKeys.length;
```

禁用行通常不参与“当前页全选”；具体规则应由组件库明确约定。

## 三、组件库 API 设计

一个可扩展的类型设计：

```tsx
import type { Key, ReactNode } from "react";

type RowKey<T> = keyof T | ((record: T) => Key);

interface RowSelection<T> {
  selectedRowKeys?: Key[];                // 受控模式
  defaultSelectedRowKeys?: Key[];         // 非受控模式的初始值
  onChange?: (keys: Key[], currentPageSelectedRows: T[]) => void;
  preserveSelectedRowKeys?: boolean;      // 数据源变化时是否保留历史 key
  getCheckboxProps?: (record: T) => { disabled?: boolean };
}

interface TableProps<T> {
  dataSource: T[];
  rowKey: RowKey<T>;
  rowSelection?: RowSelection<T>;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange?: (page: number, pageSize: number) => void;
  };
}
```

使用示例：

```tsx
type Order = {
  id: string;
  amount: number;
  status: "pending" | "paid";
};

const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

<Table<Order>
  rowKey="id"
  dataSource={orders}
  rowSelection={{
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    preserveSelectedRowKeys: true,
  }}
  pagination={{
    current: page,
    pageSize: 20,
    total,
    onChange: setPage,
  }}
/>;
```

### 受控和非受控的边界

- 传入 `selectedRowKeys` 时，外部状态是唯一可信来源；Table 通过 `onChange` 通知。
- 未传 `selectedRowKeys` 时，Table 可以内部维护选中集合，用 `defaultSelectedRowKeys` 初始化。
- `preserveSelectedRowKeys` 是否生效取决于契约：如果是受控模式，**最终是否保留跨页选择由父组件决定**，组件不能擅自删除父组件传入的 ID。
- 不要在受控与非受控之间随意切换，避免状态语义混乱。

### 为什么不建议保存完整 row？

1. 数据体积更大。
2. 不同分页返回的 row 对象引用不同，按对象比较容易出错。
3. row 可能过期，尤其是订单状态、权限和金额。
4. 选中状态只需表达“哪些实体被选中”，不应与完整业务快照混为一谈。

但要注意：即使只保存 ID，**ID 也不能证明对象仍存在或仍有操作权限**。

## 四、服务端分页与批量操作的边界

- **分页切换**：全局 key 集合不变，当前页复选框由 `has(rowKey)` 计算。
- **搜索条件改变**：明确是否保留旧搜索条件下的选择，必要时提供“清空选择”。
- **批量删除**：将 ID 提交服务端，由服务端重新验证租户、权限、记录存在性及当前状态；不可直接信任前端缓存的 row。
- **多租户**：后端必须从认证上下文约束租户，不允许仅依赖客户端提供的租户 ID。
- **大规模全选**：如果需求是“选中查询结果的全部 10 万条”，仅用已加载的 ID Set 不足够。可设计“全量筛选条件 + 排除 ID 集合”的模型，交由服务端执行；这与“当前页全选”是两个不同语义。
- **行主键**：不要使用数组下标作为跨页 `rowKey`，分页和排序后下标不稳定。

## 五、面试回答模板

> 我会把跨页选中状态设计成全局的 rowKey 集合，而不是完整 row 对象。当前页选中状态由当前页数据与全局 key 集合派生。Table 提供 `rowKey`、`selectedRowKeys`、`onSelectionChange` 等受控 API，必要时提供非受控初始值和跨页保留策略。当前页全选是把当前页可选 ID 合并进全局集合，取消全选则只删除当前页 ID，不影响其他页。批量删除时后端必须重新校验这些 ID 的权限和状态。

## 六、评分与改进建议

| 维度 | 得分 |
|---|---:|
| 问题分析 | 26/30 |
| 解决方案 | 35/40 |
| 原理理解 | 17/20 |
| 边界意识 | 8/10 |
| **总分** | **86/100** |

用户明确提出全局 selections、当前页选择、rowKey、选中回调，以及当前页全选时添加 ID、取消时删除当前页 ID，核心方案正确。需要加强派生状态与双状态同步风险、受控/非受控 API 的清晰契约、服务端数据过期与权限验证。
