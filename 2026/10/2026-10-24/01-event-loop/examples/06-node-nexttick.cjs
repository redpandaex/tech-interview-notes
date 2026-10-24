// CommonJS 顶层；执行：node 06-node-nexttick.cjs
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
process.nextTick(() => console.log("D"));
queueMicrotask(() => console.log("E"));
console.log("F");
// A F D C E B
