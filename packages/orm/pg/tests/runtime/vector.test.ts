import { describe, expect, it } from "bun:test";
import { EventEmitter } from "node:events";
import { PgModelClient } from "../../src/client";
import { attachVectorPool, serializeVectorParams } from "../../src/executor";
import { ModelAccessor } from "../../src/query";
import { ParentModel, RetryClient, VectorClient, VectorModel, VectorPool } from "../helpers/vector";

describe("native pgvector runtime", () => {
  it("serializes modeled vector writes and preserves descriptors", async () => {
    const pool = new VectorPool({ rows: [{ id: "one" }] });
    const client = new PgModelClient(VectorModel, pool as any);
    const result = await client.create({ data: { id: "one", embedding: [1, 2, 3] } });
    expect(pool.client.calls[1]?.params).toEqual(["one", "[1,2,3]"]);
    expect(result.descriptor.rows[0]?.embedding).toEqual([1, 2, 3]);
    expect(pool.client.parsers.has(100)).toBe(true);
  });

  it("validates exact dimensions and finite values before SQL", async () => {
    const pool = new VectorPool() as any;
    const client = new PgModelClient(VectorModel, pool);
    await expect(client.create({ data: { id: "bad", embedding: [1, 2] } })).rejects.toThrow(/exactly 3/);
    await expect(client.create({ data: { id: "bad", embedding: [1, 2, Number.NaN] } })).rejects.toThrow(/finite/);
    expect(pool.client.calls.filter((call: any) => call.sql.startsWith("INSERT")).length).toBe(0);
  });

  it("serializes update and explicit conflict-set vectors", async () => {
    const pool = new VectorPool({ rows: [{ id: "one" }] });
    const client = new PgModelClient(VectorModel, pool as any);
    await client.update({ set: { embedding: [1, 2, 3] }, where: { id: "one" } });
    expect(pool.client.last.params).toEqual(["[1,2,3]", "one"]);
    await client.upsert({ data: { id: "one", embedding: [3, 2, 1] }, onConflict: ["id"], set: { embedding: [1, 1, 1] } });
    expect(pool.client.last.params).toEqual(["one", "[3,2,1]", "[1,1,1]"]);
    await client.create({ data: { id: "one", embedding: [2, 2, 2] }, onConflict: { action: "update", conflictColumns: ["id"], set: { embedding: [0, 0, 0] } } });
    expect(pool.client.last.params).toEqual(["one", "[2,2,2]", "[0,0,0]"]);
  });

  it("retries a registration that failed before the extension existed", async () => {
    const client = new RetryClient();
    const pool = { connect: async () => client } as any;
    const orm = new PgModelClient(VectorModel, pool);
    await expect(orm.findMany()).rejects.toThrow(/vector type not found/);
    await expect(orm.findMany()).resolves.toBeDefined();
    expect(client.attempts).toBe(2);
  });

  it("uses and registers an exact caller-owned transaction client", async () => {
    const pool = new VectorPool({ rows: [{ id: "one" }] });
    const client = new PgModelClient(VectorModel, pool as any, pool.client as any);
    await client.findMany();
    expect(pool.client.released).toBe(0);
    const pooled = new PgModelClient(VectorModel, pool as any);
    await pooled.transaction(async (tx) => tx.findMany());
    expect(pool.client.released).toBe(1);
  });

  it("best-effort registers clients emitted by a vector-aware pool", async () => {
    const pool = new EventEmitter();
    attachVectorPool(pool as any, VectorModel);
    const client = new VectorClient();
    pool.emit("connect", client);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(client.parsers.has(100)).toBe(true);
    pool.emit("connect", new RetryClient());
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("serializes vector filters but leaves ordinary arrays untouched", () => {
    const params = serializeVectorParams(VectorModel, {
      type: "select", table: "vector_item", columns: [],
      where: [{ embedding: { in: [[1, 2, 3], [3, 2, 1]] }, compact: [1, 2], samples: [4, 5] }],
      whereRaw: [], orderBy: [], distinct: false,
    }, [[1, 2, 3], [3, 2, 1], [1, 2], [4, 5]]);
    expect(params).toEqual(["[1,2,3]", "[3,2,1]", "[1,2]", [4, 5]]);
  });

  it("keeps lateral relation parameters ahead of the parent WHERE", () => {
    const result = new ModelAccessor(ParentModel).findMany({
      with: { children: { where: { embedding: [1, 2] } } },
      where: { id: "parent" },
    });
    const params = serializeVectorParams(ParentModel, result.json, [...result.sql.params]);
    expect(params).toEqual(["[1,2]", "parent"]);
    expect(result.json.with?.[0]?.where[0]?.embedding).toEqual([1, 2]);
  });

  it("registers and serializes vector filters in a relation query", async () => {
    const pool = new VectorPool();
    const client = new PgModelClient(ParentModel, pool as any);
    await client.findMany({
      with: { children: { where: { embedding: [1, 2] }, whereRaw: { sql: '"_t"."id" = $1', params: ["child"] } } },
      where: { id: "parent" },
    } as any);
    expect(pool.client.last.params).toEqual(["[1,2]", "child", "parent"]);
    expect(pool.client.parsers.has(100)).toBe(true);
  });

});
