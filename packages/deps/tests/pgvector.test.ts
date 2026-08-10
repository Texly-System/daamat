import { describe, expect, it } from "bun:test";
import pgvector, { toSql } from "../src/pgvector";

describe("pgvector curated adapter", () => {
  it("re-exports the official serializer", () => {
    expect(toSql([1, 2, 3])).toBe("[1,2,3]");
    expect(pgvector.toSql([0.5])).toBe("[0.5]");
  });

  it("exposes node-postgres registration", () => {
    expect(typeof pgvector.registerTypes).toBe("function");
  });
});
