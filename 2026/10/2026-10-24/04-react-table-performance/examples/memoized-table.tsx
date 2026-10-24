import { memo, useCallback, useState } from "react";

type RowData = { id: string; name: string };
type RowProps = {
  row: RowData;
  selected: boolean;
  onSelect: (id: string) => void;
};

const MemoizedRow = memo(function MemoizedRow({ row, selected, onSelect }: RowProps) {
  return (
    <label style={{ display: "block" }}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(row.id)}
      />
      {row.name}
    </label>
  );
});

export default function Table({ rows }: { rows: RowData[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div>
      {rows.map((row) => (
        <MemoizedRow
          key={row.id}
          row={row}
          selected={selectedIds.has(row.id)}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}

// 假设 rows 内的行对象引用稳定且没有其他 Context/Props 更新，
// 勾选时未发生 selected 变化的行通常可以跳过重新渲染。
