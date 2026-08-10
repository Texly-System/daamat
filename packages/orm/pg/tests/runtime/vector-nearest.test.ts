import { describe, expect, it } from "bun:test";
import { columns, model } from "@damatjs/orm-model";
import { createRepository } from "../../src/repository";
import { descriptorUsesVector } from "../../src/executor";
import { ModelAccessor } from "../../src/query";
import { noopLogger } from "../helpers/fixtures";
import { PlainRoot, VectorModel, VectorPool } from "../helpers/vector";

const CollisionModel = model("collision_vector_item", {
  id: columns.text().primaryKey(),
  embedding: columns.vector(3),
  __damat_vector_distance: columns.real().nullable(),
})
  .timestamps(false)
  .softDelete(false);

describe("native pgvector nearest queries", () => {
  it("returns rows with a collision-safe wrapper distance", async () => {
    const pool = new VectorPool({
      rows: [{ id: "one", __damat_vector_distance: "0.25" }],
    });
    const repo = createRepository(VectorModel, pool as any, noopLogger);
    const result = await repo.findNearest({
      column: "embedding",
      vector: [1, 2, 3],
      distance: "cosine",
      limit: 2,
    });
    expect(result).toEqual([{ row: { id: "one" }, distance: 0.25 }]);
    expect(pool.client.calls.some((call) => call.sql.includes("<=>"))).toBe(
      true,
    );
    expect(pool.client.last.sql).toContain("LIMIT 2");
  });

  it("detects vector usage in nested relation descriptors", () => {
    const query = new ModelAccessor(PlainRoot).findMany({
      with: { child: { with: { nested: true } } },
    } as any);
    expect(descriptorUsesVector(PlainRoot, query.json)).toBe(true);
  });

  it("does not overwrite a domain column when choosing its distance alias", async () => {
    const pool = new VectorPool({
      rows: [
        {
          id: "one",
          __damat_vector_distance: 7,
          __damat_vector_distance_1: "0.25",
        },
      ],
    });
    const repo = createRepository(CollisionModel, pool as any, noopLogger);
    const result = await repo.findNearest({
      column: "embedding",
      vector: [1, 2, 3],
      distance: "l2",
      limit: 1,
    });
    expect(result[0]).toEqual({
      row: { id: "one", __damat_vector_distance: 7 },
      distance: 0.25,
    });
    expect(pool.client.last.sql).toContain("__damat_vector_distance_1");
  });

  it("shifts nearest WHERE placeholders after the query vector", async () => {
    const pool = new VectorPool();
    const repo = createRepository(VectorModel, pool as any, noopLogger);
    await repo.findNearest({
      column: "embedding",
      vector: [1, 2, 3],
      distance: "l2",
      limit: 1,
      where: { id: "one" },
    });
    expect(pool.client.last.sql).toContain('"id" = $2');
    expect(pool.client.last.params).toEqual(["[1,2,3]", "one"]);
  });
});
