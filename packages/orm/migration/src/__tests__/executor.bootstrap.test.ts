import { expect, it, describe } from "bun:test";

import { bootstrapDatabase, GENERATE_ID_SQL } from "../executor/bootstrap";
import { makeFakePool } from "./executor.test.fixture";

describe("bootstrapDatabase", () => {
  it("runs the generate_id bootstrap SQL on a pooled client and releases it", async () => {
    const fake = makeFakePool();
    await bootstrapDatabase(fake.pool);

    expect(fake.connectCount).toBe(1);
    expect(fake.clientQueries).toHaveLength(1);
    expect(fake.clientQueries[0]!.sql).toBe(GENERATE_ID_SQL);
    expect(fake.clientQueries[0]!.sql).toContain(
      "CREATE OR REPLACE FUNCTION generate_id",
    );
    expect(fake.releaseCount).toBe(1);
  });

  it("releases the client even when the bootstrap query throws", async () => {
    const fake = makeFakePool({ failOn: () => true });
    await expect(bootstrapDatabase(fake.pool)).rejects.toThrow("boom");
    expect(fake.releaseCount).toBe(1);
  });
});
