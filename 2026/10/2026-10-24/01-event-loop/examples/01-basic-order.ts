console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
queueMicrotask(() => console.log("D"));
async function test(): Promise<void> {
  console.log("E");
  await Promise.resolve();
  console.log("F");
}
void test();
console.log("G");
// A E G C D F B
