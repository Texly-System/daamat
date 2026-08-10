import { dirname } from "node:path";

export function moduleDevEnv(
  databaseUrl: string,
): Record<string, string | undefined> {
  return {
    ...process.env,
    DATABASE_URL: databaseUrl,
    LOG_LEVEL: "fatal",
    REDIS_URL: "",
    NO_COLOR: "1",
    PATH: `${dirname(process.execPath)}:${process.env.PATH ?? ""}`,
  };
}

export async function within<T>(
  work: Promise<T>,
  ms: number,
  message = "Module dev timed out",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([work, expired]).finally(() => clearTimeout(timer));
}

export async function read(
  stream: ReadableStream<Uint8Array>,
  update?: (text: string) => void,
): Promise<string> {
  let text = "";
  for await (const chunk of stream) {
    text += new TextDecoder().decode(chunk);
    update?.(text);
  }
  return text;
}
