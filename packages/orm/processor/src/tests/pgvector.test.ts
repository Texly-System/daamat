import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ModuleSchema } from "@damatjs/orm-type";
import { diffSchemas } from "../diff/diffSchemas";
import { diffIndexes } from "../diff/indexes";
import { indexesEqual } from "../diff/utils";
import { requiredExtensions, withRequiredExtensions } from "../diff/extensions";
import { reverseDiff } from "../diff/reverse";
import { generateFromDiff } from "../sqlGenerator/generateMigration/generateFromDiff";
import { generateFromSnapshot } from "../sqlGenerator/generateMigration/generateFromSnapshot";
import { generateCreateExtension } from "../sqlGenerator/extensions";
import { generateCreateIndex, generateDropIndex } from "../sqlGenerator/indexes";
import { renderIndexColumn, renderStorageParams } from "../sqlGenerator/indexFragments";
import { columnTypeSql } from "../sqlGenerator/utils";
import { loadSnapshot, saveSnapshot } from "../snapshot";

const opts = { schema: "public", safeMode: true, cascadeDrops: false };
const vector = (type: "vector" | "halfvec", dimensions: number) =>
  ({ name: "embedding", type, dimensions, nullable: false, array: false });
const schema = (columns = [vector("halfvec", 2048)]): ModuleSchema => ({
  moduleName: "assets", schema: "public", tables: [{ name: "asset", columns }],
});

describe("native pgvector processor", () => {
  it("adds extensions before vector tables and persists inferred requirements", () => {
    const current = schema(); const diff = diffSchemas(schema([]), current);
    expect(diff.changes[0]?.type).toBe("create_extension");
    const sql = generateFromDiff(diff).upStatements;
    expect(sql[0]).toBe("CREATE EXTENSION IF NOT EXISTS vector");
    expect(sql[1]).toContain('"embedding" HALFVEC(2048)');
    expect(generateFromSnapshot(current).upStatements[0]).toContain("vector");
    expect(requiredExtensions({ ...current, extensions: [] })).toEqual(["vector"]);
    expect(withRequiredExtensions(current).extensions).toEqual(["vector"]);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vector-snapshot-"));
    saveSnapshot(dir, current);
    const saved = JSON.parse(fs.readFileSync(path.join(dir, "schema-snapshot.json")));
    expect(saved.extensions).toEqual(["vector"]);
    expect(diffSchemas(loadSnapshot(dir, "assets"), current).hasChanges).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("manualizes native type and dimension changes while preserving safe clauses", () => {
    const previous = schema([vector("vector", 1536)]);
    const current = schema([{ ...vector("halfvec", 2048), nullable: true, default: "'x'" }]);
    const diff = diffSchemas(previous, current);
    expect(diff.warnings[0]).toContain("asset.embedding");
    const statements = generateFromDiff(diff).upStatements;
    expect(statements[0]).toContain("MANUAL REVIEW");
    expect(statements.some((sql) => sql.includes("DROP NOT NULL"))).toBe(true);
    expect(reverseDiff(diff).changes[0]?.type).toBe("alter_column");
    expect(reverseDiff(diff).changes[0]?.type === "alter_column" && reverseDiff(diff).changes[0].changes.dimensions?.from).toBe(2048);
  });

  it("never drops the vector extension when the last vector column is removed", () => {
    const diff = diffSchemas(schema(), schema([]));
    const sql = generateFromDiff(diff).upStatements.join("\n");
    expect(sql).toContain("DROP COLUMN");
    expect(sql).not.toContain("DROP EXTENSION");
  });

  it("treats missing and empty extension lists as equivalent", () => {
    expect(diffSchemas({ ...schema([]), extensions: [] }, schema([])).hasChanges).toBe(false);
  });

  it("renders pgvector index methods, expressions, opclasses, storage, and concurrency", () => {
    const expression = { expression: "(embedding::halfvec(2048))", operatorClass: "halfvec_cosine_ops" as const };
    const index = { name: "asset_embedding_hnsw", columns: [expression], type: "hnsw" as const, with: { ef_construction: 64, m: 16 }, where: "embedding IS NOT NULL", concurrently: true };
    expect(generateCreateIndex(index, "asset", "public", opts)).toBe('CREATE INDEX CONCURRENTLY IF NOT EXISTS "asset_embedding_hnsw" ON "public"."asset" USING HNSW ((embedding::halfvec(2048)) halfvec_cosine_ops) WITH (ef_construction = 64, m = 16) WHERE embedding IS NOT NULL');
    expect(generateCreateIndex({ name: "i", columns: [{ name: "embedding", operatorClass: "vector_cosine_ops" }], type: "ivfflat" }, "asset", "public", opts)).toContain("USING IVFFLAT (\"embedding\" vector_cosine_ops)");
    expect(generateDropIndex({ type: "drop_index", tableName: "asset", indexName: "i", concurrently: true, priority: 1 }, opts)).toBe('DROP INDEX CONCURRENTLY IF EXISTS "public"."i"');
    const previous = { ...schema([]), tables: [{ name: "asset", columns: [vector("vector", 3)], indexes: [{ name: "asset_idx", columns: ["embedding"], concurrently: true }] }] };
    const changed = { ...previous, tables: [{ ...previous.tables[0], indexes: [{ name: "asset_idx", columns: ["embedding"], concurrently: true, where: "embedding IS NOT NULL" }] }] };
    expect(generateFromDiff(diffSchemas(previous, changed)).upStatements[0]).toContain("DROP INDEX CONCURRENTLY");
  });

  it("keeps ordinary arrays distinct and validates extension names", () => {
    expect(columnTypeSql(vector("vector", 1536))).toBe("VECTOR(1536)");
    expect(columnTypeSql({ name: "samples", type: "real", nullable: false, array: true })).toBe("REAL[]");
    expect(generateCreateExtension({ type: "create_extension", extension: "vector", priority: 1 }, opts)).toContain("vector");
    expect(() => generateCreateExtension({ type: "create_extension", extension: "bad;drop", priority: 1 }, opts)).toThrow("Invalid");
    expect(() => columnTypeSql(vector("vector", 0))).toThrow("dimensions");
    expect(renderStorageParams()).toBe("");
    expect(renderStorageParams({ label: "o'reilly" })).toContain("o''reilly");
    expect(renderIndexColumn({ name: "embedding" })).toBe('"embedding"');
    expect(indexesEqual({ columns: ["a"], with: { m: 1 } }, { columns: ["a"], with: { m: 1 } })).toBe(true);
    expect(() => diffIndexes("asset", [], [{ columns: [{ expression: "embedding" }] }])).toThrow("Expression");
    expect(() => generateCreateIndex({ columns: [{ expression: "embedding" }] }, "asset", "public", opts)).toThrow("Expression");
  });
});
