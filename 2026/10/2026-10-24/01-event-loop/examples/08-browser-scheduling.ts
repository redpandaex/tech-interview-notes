// 浏览器环境中执行；不要用 Node.js 直接运行。
console.log("sync");
requestAnimationFrame(() => console.log("before repaint"));
requestIdleCallback((deadline: IdleDeadline) => {
  console.log("idle budget", deadline.timeRemaining());
}, { timeout: 1000 });
console.log("sync end");
// 前两个输出固定为 sync、sync end；后续回调相对先后不作保证。
