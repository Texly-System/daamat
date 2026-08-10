import { describe, it, expect } from "bun:test";
import { indexBuilder } from "@/properties/indexes";
import { columns } from "@/properties";

describe("indexBuilder factory", () => {
  it("creates an IndexBuilder seeded with the given name", () => {
    const schema = indexBuilder("user_email_idx")
      .columns(["email"])
      .toSchema("user");
    expect(schema.name).toBe("user_email_idx");
  });
});

describe("IndexBuilder fluent options", () => {
  it("where() attaches a partial index predicate", () => {
    const schema = indexBuilder("u_idx")
      .columns(["email"])
      .where("deleted_at IS NULL")
      .toSchema("user");
    expect(schema.where).toBe("deleted_at IS NULL");
  });

  it("preserves concurrently and storage parameters", () => {
    const builder = indexBuilder("u_idx")
      .columns(["email"])
      .with({ fillfactor: 80 })
      .concurrently();
    expect(builder.concurrently()).toBe(builder);
    const schema = builder.toSchema("user");
    expect(schema.concurrently).toBe(true);
    expect(schema.with).toEqual({ fillfactor: 80 });
  });

  it("preserves expression columns and operator classes", () => {
    const schema = indexBuilder("embedding_hnsw")
      .columns([
        { expression: "(embedding::halfvec(2048))", operatorClass: "halfvec_cosine_ops" },
      ])
      .type("hnsw")
      .toSchema("asset");
    expect(schema.columns).toEqual([
      { expression: "(embedding::halfvec(2048))", operatorClass: "halfvec_cosine_ops" },
    ]);
    expect(schema.type).toBe("hnsw");
  });

  it("requires a name for expression indexes", () => {
    expect(() =>
      columns.indexes().columns([{ expression: "lower(email)" }]).toSchema("user"),
    ).toThrow(/explicit name/);
  });
});
