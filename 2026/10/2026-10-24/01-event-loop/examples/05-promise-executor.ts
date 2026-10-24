async function foo(): Promise<void> {
  console.log(1);
  await new Promise<void>((resolve) => {
    console.log(2);
    resolve();
    console.log(3);
  });
  console.log(4);
}
console.log(5);
void foo();
Promise.resolve().then(() => console.log(6));
console.log(7);
// 5 1 2 3 7 4 6
