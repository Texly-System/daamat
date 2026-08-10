import { describe, expect, it } from "bun:test";

import { MigrationTracker } from "../tracker";
import { makeStatefulPool } from "./tracker.collision.fixture";

describe("MigrationTracker — id collision cannot clobber a different module", () => {
  it("records two colliding (module, name) pairs as two distinct rows", async () => {
    const { pool, rows } = makeStatefulPool();
    const tracker = new MigrationTracker(pool);
    await tracker.recordApplied("a_b", "c", 1);
    await tracker.recordApplied("a", "b_c", 1);

    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.id)).size).toBe(2);
    expect((await tracker.getApplied("a_b")).map((row) => row.name)).toEqual([
      "c",
    ]);
    expect((await tracker.getApplied("a")).map((row) => row.name)).toEqual([
      "b_c",
    ]);
  });

  it("re-applying the same (module, name) upserts in place (no second row)", async () => {
    const { pool, rows } = makeStatefulPool();
    const tracker = new MigrationTracker(pool);
    await tracker.recordApplied("user", "Migration1_Initial", 10);
    await tracker.recordApplied("user", "Migration1_Initial", 20);

    expect(rows).toHaveLength(1);
    expect((await tracker.getApplied("user")).map((row) => row.name)).toEqual([
      "Migration1_Initial",
    ]);
  });

  it("a pre-existing old-scheme row still reads as applied and is not re-inserted", async () => {
    const { pool, rows } = makeStatefulPool();
    rows.push({
      id: "user_Migration1_Initial",
      module: "user",
      name: "Migration1_Initial",
      status: "applied",
    });
    const tracker = new MigrationTracker(pool);
    await tracker.recordApplied("user", "Migration1_Initial", 5);

    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("user_Migration1_Initial");
    expect((await tracker.getApplied("user")).map((row) => row.name)).toEqual([
      "Migration1_Initial",
    ]);
  });
});
