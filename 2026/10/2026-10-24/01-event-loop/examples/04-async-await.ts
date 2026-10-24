async function foo(): Promise<void> {
  console.log(1);
  await 100;
  console.log(2);
}
console.log(3);
void foo();
Promise.resolve().then(() => console.log(4));
console.log(5);
// 3 1 5 2 4
