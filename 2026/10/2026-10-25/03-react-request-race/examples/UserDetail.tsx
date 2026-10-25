import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "success"; user: User }
  | { status: "error"; message: string };

export function UserDetail({ userId }: { userId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setState({ status: "loading" });
      try {
        const response = await fetch(
          `/api/users/${encodeURIComponent(userId)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const user = (await response.json()) as User;

        // Prevent stale results from being committed after cleanup.
        if (!controller.signal.aborted) {
          setState({ status: "success", user });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    void load();
    return () => controller.abort();
  }, [userId]);

  if (state.status === "loading") return <p>Loading...</p>;
  if (state.status === "error") return <p role="alert">{state.message}</p>;
  return <p>{state.user.name}</p>;
}

// Note: The JSON cast above is only static typing. Validate untrusted
// API responses with a runtime schema if the endpoint requires it.
