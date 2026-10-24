import { useState } from "react";

export default function MixedUpdates() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1); // 设置为 snapshot + 1
    setCount(prev => prev + 1);
    setCount(count + 1); // 再次覆盖为 snapshot + 1
    setCount(prev => prev + 1);
    console.log("snapshot:", count); // 初次点击 0
  }

  // 初次点击：0 -> 1 -> 2 -> 1 -> 2，因此最终为 2
  return <button onClick={handleClick}>Count: {count}</button>;
}
