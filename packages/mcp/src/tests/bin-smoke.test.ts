import { expect, test } from "bun:test";
import { resolve } from "node:path";

const RESPONSE_TIMEOUT_MS = 15_000;

async function readLine(
  stream: ReadableStream<Uint8Array>,
  timeoutMs = RESPONSE_TIMEOUT_MS,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";
  const deadline = Date.now() + timeoutMs;
  try {
    while (!output.includes("\n")) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw new Error(
          `Timed out after ${timeoutMs}ms waiting for MCP response`,
        );
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const next = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () =>
                reject(
                  new Error(
                    `Timed out after ${timeoutMs}ms waiting for MCP response`,
                  ),
                ),
              remaining,
            );
          }),
        ]);
        if (next.done) {
          throw new Error(
            "MCP server closed stdout before sending a complete JSON-RPC response",
          );
        }
        output += decoder.decode(next.value, { stream: true });
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    return output.trim();
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

test(
  "damat-mcp executable serves JSON-RPC over stdio",
  async () => {
    const child = Bun.spawn(
      [process.execPath, resolve(import.meta.dir, "../../bin/damat-mcp.ts")],
      { stdin: "pipe", stdout: "pipe", stderr: "pipe" },
    );
    let exited = false;
    try {
      child.stdin.write(
        JSON.stringify({ jsonrpc: "2.0", id: 7, method: "initialize" }) + "\n",
      );
      await child.stdin.flush();
      const output = await readLine(child.stdout);
      child.stdin.end();
      expect(await child.exited).toBe(0);
      exited = true;
      const response = JSON.parse(output);
      expect(response.id).toBe(7);
      expect(response.result.serverInfo.name).toBe("damat-mcp");
    } finally {
      if (!exited) {
        try {
          child.stdin.end();
        } catch {
          // The child may have closed stdin while reporting an error.
        }
        child.kill();
        await child.exited;
      }
    }
  },
  { timeout: 30_000 },
);
