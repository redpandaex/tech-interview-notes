// CommonJS；执行：node 07-node-immediate.cjs
const fs = require("node:fs");
console.log("A");
setTimeout(() => console.log("B"), 0);
setImmediate(() => console.log("C"));
fs.readFile(__filename, () => {
  console.log("D");
  setTimeout(() => console.log("E"), 0);
  setImmediate(() => console.log("F"));
});
console.log("G");
// A 在 G 前；顶层 B/C 不保证固定；I/O 回调中 F 在 E 前。
