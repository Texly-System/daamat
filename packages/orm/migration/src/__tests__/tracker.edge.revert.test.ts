import { describe, expect, it } from "bun:test";
import { MigrationTracker } from "../tracker";
import { makeFakePool, norm } from "./tracker.test.fixture";

describe("MigrationTracker.recordReverted then re-apply", () => {
  it("recordReverted keys off (module, name); a subsequent recordApplied re-upserts", async () => {
    const { pool, queries } = makeFakePool();
    const tracker = new MigrationTracker(pool);
    await tracker.recordApplied("user", "Migration1_Initial", 10);
    await tracker.recordReverted("user", "Migration1_Initial");
    await tracker.recordApplied("user", "Migration1_Initial", 20);

    expect(queries[0]!.params?.[0]).toBe("4_user_Migration1_Initial");
    expect(queries[1]!.params).toEqual(["user", "Migration1_Initial"]);
    expect(queries[2]!.params?.[0]).toBe("4_user_Migration1_Initial");
    expect(norm(queries[1]!.sql)).toContain("status = 'reverted'");
    expect(norm(queries[2]!.sql)).toContain(
      "ON CONFLICT (module, name) DO UPDATE SET",
    );
  });
});
