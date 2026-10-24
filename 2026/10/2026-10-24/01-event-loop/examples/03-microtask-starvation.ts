// 默认只执行有限次数；切勿在重要浏览器标签页运行无限版本。
let count = 0;
setTimeout(() => console.log("timer"), 0);
function loop(): void {
  count += 1;
  if (count < 5) queueMicrotask(loop);
  else console.log("finished microtasks:", count);
}
loop();
// 输出 finished microtasks: 5，然后 timer。
// 若去掉 count < 5 条件，微任务持续产生，timer 将无法得到执行机会。
