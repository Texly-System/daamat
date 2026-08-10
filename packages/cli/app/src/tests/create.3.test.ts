// setup.ts installs the process-global node:fs + node:child_process mocks and
// MUST be imported before the source under test (see its header comment).
import { writeCalls, resetMocks } from "./setup";
import { describe, test, expect, beforeEach } from "bun:test";
import { createCommand } from "../commands/create";
import { createContext } from "./helpers";

beforeEach(() => {
  resetMocks();
});

const runCreate = (args: string[], options: Record<string, unknown> = {}) => {
  const { ctx, logger } = createContext(
    { git: true, install: true, databaseSetup: false, ...options },
    { args, cwd: "/base" } as never,
  );
  return { result: createCommand.handler(ctx), logger };
};

const written = (suffix: string) =>
  writeCalls.find((c) => c.path.endsWith(suffix));

type GeneratedConfig = { projectConfig: { nodeEnv?: string } };

const loadGeneratedConfig = (
  source: string,
  nodeEnv?: string,
): GeneratedConfig => {
  const transformed = source
    .replace(
      'import { defineConfig } from "@damatjs/framework";',
      "",
    )
    .replace("export default defineConfig", "return defineConfig");
  const configProcess = { env: nodeEnv ? { NODE_ENV: nodeEnv } : {} };
  const defineConfig = (config: GeneratedConfig) => config;
  return new Function("process", "defineConfig", transformed)(
    configProcess,
    defineConfig,
  ) as GeneratedConfig;
};

describe("damat create — scaffold", () => {
  test(".env gets generated secrets and a commented-out REDIS_URL; .env.example stays placeholder", async () => {
    await runCreate(["my-api"]).result;
    const env = written("my-api/.env")!.content;
    expect(env).toMatch(/JWT_SECRET="[0-9a-f]{64}"/);
    expect(env).toMatch(/COOKIE_SECRET="[0-9a-f]{64}"/);
    expect(env).toContain('# REDIS_URL="redis://localhost:6379"');
    expect(env).toContain("postgres://postgres:postgres@localhost:5432/my_api");

    const example = written("my-api/.env.example")!.content;
    expect(example).toContain('JWT_SECRET=""');
    expect(example).toContain('REDIS_URL="redis://localhost:6379"');
  });

  test("damat.config.ts carries an empty modules block for module add to fill", async () => {
    await runCreate(["my-api"]).result;
    const config = written("my-api/damat.config.ts")!.content;
    expect(config).toContain("modules: {}");
    expect(config).toContain('prefix: "my-api"');
    expect(config).toContain("releaseVersion: process.env.RELEASE_VERSION");
    expect(config).toContain('mode: "all"');
    expect(config).toContain('workers: ["jobs", "events", "pipelines"]');
    expect(config).toContain('inspectionVisibility: "metadata"');
    expect(config).toContain("events: { durable:");
    expect(config).toContain("pipelines:");
  });

  test("generated config maps only exact production NODE_ENV to production", async () => {
    await runCreate(["my-api"]).result;
    const source = written("my-api/damat.config.ts")!.content;
    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).not.toContain('nodeEnv: "development"');
    const production = await loadGeneratedConfig(source, "production");
    const absent = await loadGeneratedConfig(source);
    const staging = await loadGeneratedConfig(source, "staging");
    expect(production.projectConfig.nodeEnv).toBe("production");
    expect(absent.projectConfig.nodeEnv).toBe("development");
    expect(staging.projectConfig.nodeEnv).toBe("development");
  });

  test("tsconfig has the app-level @workflows aliases module add expects", async () => {
    await runCreate(["my-api"]).result;
    const tsconfig = JSON.parse(written("my-api/tsconfig.json")!.content);
    expect(tsconfig.compilerOptions.paths["@workflows"]).toEqual([
      "./src/workflows",
    ]);
    expect(tsconfig.compilerOptions.paths["@/*"]).toEqual(["./src/*"]);
  });
});
