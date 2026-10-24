console.log("1");
setTimeout(() => {
  console.log("2");
  Promise.resolve().then(() => console.log("3"));
}, 0);
Promise.resolve().then(() => {
  console.log("4");
  queueMicrotask(() => console.log("5"));
});
queueMicrotask(() => console.log("6"));
console.log("7");
// 1 7 4 6 5 2 3
