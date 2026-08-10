import { describe, expect, it } from "bun:test";
import { PgModelClient } from "../../src/client";
import { VectorModel, VectorPool } from "../helpers/vector";

describe("native pgvector bulk mutations", () => {
  it("keeps first-row column order for reordered createMany rows", async () => {
    const pool = new VectorPool();
    const client = new PgModelClient(VectorModel, pool as any);
    await client.createMany({
      data: [
        { id: "one", embedding: [1, 2, 3] },
        { embedding: [3, 2, 1], id: "two" },
      ],
    });
    expect(pool.client.last.params).toEqual([
      "one",
      "[1,2,3]",
      "two",
      "[3,2,1]",
    ]);
  });

  it("keeps first-row column order for reordered upsertMany rows", async () => {
    const pool = new VectorPool();
    const client = new PgModelClient(VectorModel, pool as any);
    await client.upsertMany({
      data: [
        { id: "one", embedding: [1, 2, 3] },
        { embedding: [3, 2, 1], id: "two" },
      ],
      onConflict: ["id"],
    });
    expect(pool.client.last.params).toEqual([
      "one",
      "[1,2,3]",
      "two",
      "[3,2,1]",
    ]);
  });

  it("does not serialize ignored DO NOTHING set values", async () => {
    const pool = new VectorPool();
    const client = new PgModelClient(VectorModel, pool as any);
    await client.create({
      data: { id: "one", embedding: [1, 2, 3] },
      onConflict: {
        action: "nothing",
        conflictColumns: ["id"],
        set: { embedding: [3, 2, 1] },
      },
    });
    expect(pool.client.last.sql).toContain("DO NOTHING");
    expect(pool.client.last.params).toEqual(["one", "[1,2,3]"]);
  });
});
