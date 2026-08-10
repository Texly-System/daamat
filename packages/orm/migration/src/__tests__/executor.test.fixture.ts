import fs from "node:fs";
import path from "node:path";
import type { MigrationInfo } from "../types";
export interface RecordedQuery {
  sql: string;
  params?: unknown[];
}
export interface AppliedRow {
  module: string;
  name: string;
  applied_at: Date;
}
export interface FakePoolOptions {
  applied?: Record<string, AppliedRow[]>;
  failOn?: (sql: string) => boolean;
  poolFailOn?: (sql: string) => boolean;
}
export function makeFakePool(opts: FakePoolOptions = {}) {
  const poolQueries: RecordedQuery[] = [];
  const clientQueries: RecordedQuery[] = [];
  let releaseCount = 0;
  let connectCount = 0;
  const resolveApplied = (sql: string, params?: unknown[]) => {
    if (!/status = 'applied'/.test(sql)) return [];
    const moduleName = params?.[0] as string | undefined;
    if (moduleName && opts.applied?.[moduleName])
      return opts.applied[moduleName];
    if (!moduleName) return Object.values(opts.applied ?? {}).flat();
    return [];
  };
  const pool = {
    query: async (sql: string, params?: unknown[]) => {
      poolQueries.push({ sql, params });
      if (opts.poolFailOn?.(sql))
        throw new Error("pool-boom: " + sql.slice(0, 20));
      const rows = resolveApplied(sql, params);
      return { rows, rowCount: rows.length };
    },
    connect: async () => {
      connectCount++;
      return {
        query: async (sql: string, params?: unknown[]) => {
          clientQueries.push({ sql, params });
          if (opts.failOn?.(sql)) throw new Error("boom: " + sql.slice(0, 20));
          return { rows: [], rowCount: 0 };
        },
        release: () => {
          releaseCount++;
        },
      };
    },
  };
  return {
    pool: pool as any,
    poolQueries,
    clientQueries,
    get releaseCount() {
      return releaseCount;
    },
    get connectCount() {
      return connectCount;
    },
  };
}
export function makeModule(
  tmpRoot: string,
  counter: number,
  files: { name: string; sql?: string }[],
) {
  const name = `module_${counter}`;
  const dir = path.join(tmpRoot, `mod_${counter}`);
  fs.mkdirSync(path.join(dir, "migrations"), { recursive: true });
  for (const file of files) {
    fs.writeFileSync(
      path.join(dir, "migrations", `${file.name}.sql`),
      file.sql ?? `-- ${file.name}\nSELECT 1;`,
    );
  }
  return { dir, name };
}
export function makeMigrationInfo(dir: string, name: string): MigrationInfo {
  return {
    name,
    resolver: dir,
    path: path.resolve(dir, "migrations", `${name}.sql`),
    timestamp: 0,
    applied: false,
  };
}
