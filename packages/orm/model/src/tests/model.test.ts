import { describe, it, expect } from "bun:test";
import { CategorySchema, UserSchema } from "./__fixtures__/models";

// ─────────────────────────────────────────────────────────────────────────────
// Model definition — table name and postgres schema
// ─────────────────────────────────────────────────────────────────────────────

describe("transform › model definition", () => {
  it("sets table name", () => {
    expect(CategorySchema.toTableSchema().name).toBe("categories");
  });

  it("sets postgres schema name when provided", () => {
    expect((UserSchema.toTableSchema() as { schema?: string }).schema).toBe(
      "store",
    );
  });

  it("omits schema when not provided", () => {
    expect(
      (CategorySchema.toTableSchema() as { schema?: string }).schema,
    ).toBeUndefined();
  });
});
