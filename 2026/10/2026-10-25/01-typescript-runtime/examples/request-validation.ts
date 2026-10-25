// 运行：npm i zod && npx tsx examples/request-validation.ts
// 这是独立演示，使用 mock fetch 返回错误的服务端数据。
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  age: z.number(),
});
type User = z.infer<typeof UserSchema>;

async function request<T>(
  url: string,
  schema: z.ZodType<T>,
  fetcher: typeof fetch = fetch,
): Promise<T> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json: unknown = await response.json();
  return schema.parse(json);
}

const fakeFetch: typeof fetch = async () =>
  new Response(JSON.stringify({ id: 1001, name: "Tom", age: "25" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

async function main(): Promise<void> {
  try {
    const user: User = await request("/api/user", UserSchema, fakeFetch);
    console.log(user.age.toFixed(2));
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("运行时校验失败：", error.issues);
      return;
    }
    throw error;
  }
}
void main();
