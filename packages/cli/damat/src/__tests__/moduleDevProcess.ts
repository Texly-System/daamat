import { waitForReadiness } from "./moduleDevReadiness";
import { moduleDevEnv, read, within } from "./moduleDevUtils";
type Child = ReturnType<typeof Bun.spawn>;
const STARTUP_TIMEOUT = 90_000;
const SHUTDOWN_TIMEOUT = 30_000;
export interface ProcessResult {
  code: number;
  stdout: string;
  stderr: string;
}
export interface RunningModuleDev {
  port: number;
  output: () => string;
  waitForReadiness: (count: number) => Promise<number>;
  stop: () => Promise<ProcessResult>;
}
export function moduleDevChild(
  cwd: string,
  databaseUrl: string,
  port: number,
): Child {
  return Bun.spawn([process.execPath, "run", "dev", "--port", String(port)], {
    cwd,
    env: moduleDevEnv(databaseUrl),
    stdout: "pipe",
    stderr: "pipe",
  });
}
export async function startModuleDev(
  cwd: string,
  databaseUrl: string,
): Promise<RunningModuleDev> {
  const child = moduleDevChild(cwd, databaseUrl, 0);
  let output = "";
  let booting = true;
  let ready!: (port: number) => void;
  let failed!: (error: Error) => void;
  const listening = new Promise<number>((resolve, reject) => {
    ready = (port) => {
      if (booting) {
        booting = false;
        resolve(port);
      }
    };
    failed = (error) => {
      if (booting) {
        booting = false;
        reject(error);
      }
    };
  });
  const stdout = read(child.stdout, (text) => {
    output = text;
    const match = text.match(/ready at http:\/\/localhost:(\d+)/);
    if (match) ready(Number(match[1]));
  });
  const stderr = read(child.stderr);
  void child.exited.then(async (code) => {
    if (!booting) return;
    failed(new Error(`Module dev exited ${code}: ${await stderr}`));
  });
  try {
    const port = await within(listening, STARTUP_TIMEOUT);
    return {
      port,
      output: () => output,
      waitForReadiness: (count) => waitForReadiness(() => output, count),
      stop: async () => {
        child.kill("SIGINT");
        try {
          const code = await within(
            child.exited,
            SHUTDOWN_TIMEOUT,
            "Module dev shutdown timed out",
          );
          return { code, stdout: await stdout, stderr: await stderr };
        } catch (error) {
          child.kill("SIGKILL");
          await child.exited;
          await Promise.all([stdout, stderr]);
          throw error;
        }
      },
    };
  } catch (error) {
    child.kill("SIGKILL");
    await child.exited;
    await Promise.all([stdout, stderr]);
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${detail}\nModule dev output:\n${output}`, {
      cause: error,
    });
  }
}
