import { describe, expect, it } from "bun:test";
import { createRepository } from "../../src/repository";
import { noopLogger } from "../helpers/fixtures";
import { VectorModel, VectorPool } from "../helpers/vector";

describe("native pgvector nearest validation", () => {
  it("rejects invalid nearest options before SQL", async () => {
    const pool = new VectorPool();
    const repo = createRepository(VectorModel, pool as any, noopLogger);
    await expect(
      repo.findNearest({
        column: "id" as any,
        vector: [1, 2, 3],
        distance: "l2",
        limit: 1,
      }),
    ).rejects.toThrow(/native vector/);
    for (const distance of ["bad", "constructor", "toString", "__proto__"])
      await expect(
        repo.findNearest({
          column: "embedding",
          vector: [1, 2, 3],
          distance: distance as any,
          limit: 1,
        }),
      ).rejects.toThrow(/Unknown vector/);
    await expect(
      repo.findNearest({
        column: "embedding",
        vector: [1, 2, 3],
        distance: "l2",
        limit: 0,
      }),
    ).rejects.toThrow(/positive integer/);
    expect(pool.client.calls).toHaveLength(0);
  });
});
