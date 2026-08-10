import { describe, expect, it } from "bun:test";
import { columns } from "@/properties";
import { model, toModuleSchema } from "@/schema";
import { cleanupIndexSchema, pgTypeToTsBase } from "@/utils";

describe("native pgvector schema contracts", () => {
  it("emits VECTOR metadata and number[] inference", () => {
    const embedding = columns.vector(1536);
    const table = model("vector_asset", { embedding }).toTableSchema();
    const column = table.columns[0]!;
    expect(column).toMatchObject({
      name: "embedding",
      type: "vector",
      dimensions: 1536,
      array: false,
    });
    expect(column.length).toBeUndefined();
    expect(model("vector_asset_ts", { embedding }).toTsType()).toContain(
      "embedding: number[];",
    );
  });

  it("derives and deduplicates vector extensions", () => {
    const vector = model("extension_asset", {
      embedding: columns.halfVector(2048),
    });
    expect(toModuleSchema("assets", [vector], {
      extensions: ["vector", "postgis", "postgis"],
    }).extensions).toEqual(["postgis", "vector"]);
  });

  it("keeps ordinary arrays separate from vector columns", () => {
    const table = model("array_asset", {
      values: columns.real().array(),
    }).toTableSchema();
    expect(table.columns[0]).toMatchObject({ type: "real", array: true });
    expect(toModuleSchema("arrays", [model("plain", {
      values: columns.real().array(),
    })]).extensions).toBeUndefined();
  });

  it("maps both native vector types to number[]", () => {
    expect(pgTypeToTsBase("vector")).toBe("number[]");
    expect(pgTypeToTsBase("halfvec")).toBe("number[]");
  });

  it("preserves full index metadata during cleanup", () => {
    const schema = cleanupIndexSchema("asset", {
      name: "asset_embedding_hnsw",
      columns: [{ name: "embedding", operatorClass: "vector_cosine_ops" }],
      type: "hnsw",
      concurrently: true,
      where: "embedding IS NOT NULL",
      with: { m: 16, ef_construction: 64 },
    });
    expect(schema).toEqual({
      name: "asset_embedding_hnsw",
      columns: [{ name: "embedding", operatorClass: "vector_cosine_ops" }],
      unique: false,
      type: "hnsw",
      concurrently: true,
      where: "embedding IS NOT NULL",
      with: { m: 16, ef_construction: 64 },
    });
  });
});
