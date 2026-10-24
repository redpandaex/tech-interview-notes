import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  function handleValueUpdates() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    console.log("same render snapshot:", count); // 首次点击：0；渲染后 count 为 1
  }

  function handleFunctionalUpdates() {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    console.log("same render snapshot:", count); // 同样是当前渲染快照
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleValueUpdates}>Value update ×3</button>
      <button onClick={handleFunctionalUpdates}>Functional update ×3</button>
    </div>
  );
}
