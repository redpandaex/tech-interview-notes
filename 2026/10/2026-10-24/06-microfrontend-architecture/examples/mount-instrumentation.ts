type MountProps = { container?: HTMLElement; version?: string };

export async function mount(props: MountProps): Promise<void> {
  const start = performance.now();
  console.info("[child] mount:start", props.version);
  try {
    if (!props.container) throw new Error("missing container");
    // 在此调用框架实际 mount/root.render。
    console.info("[child] mount:success", { elapsedMs: performance.now() - start });
  } catch (error) {
    console.error("[child] mount:failure", { error, version: props.version });
    throw error;
  }
}
