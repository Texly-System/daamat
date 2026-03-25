import { describe, it, expect } from "bun:test";
import { model } from "@/schema";
import { columns } from "@/properties";
import {
  CategorySchema,
  UserSchema,
  ProductSchema,
} from "./__fixtures__/models";

// ─────────────────────────────────────────────────────────────────────────────
// Column types — one assertion per column builder feature
// ─────────────────────────────────────────────────────────────────────────────

describe("transform › column types", () => {
  it("id column emits text type with prefixed default and primaryKey flag", () => {
    const col = CategorySchema.toTableSchema().columns.find(
      (c) => c.name === "id",
    )!;
    expect(col.type).toBe("text");
    expect(col.default).toBe("generate_id('cat')");
    expect(col.primaryKey).toBe(true);
  });

  it("id column without prefix emits no default", () => {
    const T = model("things", { id: columns.id().primaryKey() });
    const col = T.toTableSchema().columns.find((c) => c.name === "id")!;
    expect(col.type).toBe("text");
    expect(col.default).toBeUndefined();
    expect(col.primaryKey).toBe(true);
  });

  it("varchar column carries length and correct SQL type", () => {
    const col = CategorySchema.toTableSchema().columns.find(
      (c) => c.name === "name",
    )!;
    expect(col.type).toBe("character varying");
    expect(col.length).toBe(128);
  });

  it("unique varchar column is marked unique", () => {
    const col = CategorySchema.toTableSchema().columns.find(
      (c) => c.name === "slug",
    )!;
    expect(col.unique).toBe(true);
  });

  it("nullable text column is marked nullable", () => {
    const col = CategorySchema.toTableSchema().columns.find(
      (c) => c.name === "description",
    )!;
    expect(col.nullable).toBe(true);
  });

  it("timestamp with timezone column has correct type and defaultNow", () => {
    const col = CategorySchema.toTableSchema().columns.find(
      (c) => c.name === "createdAt",
    )!;
    expect(col.type).toBe("timestamp with time zone");
    expect(col.default).toBe("now()");
  });

  it("boolean column with default false", () => {
    const col = UserSchema.toTableSchema().columns.find(
      (c) => c.name === "verified",
    )!;
    expect(col.type).toBe("boolean");
    expect(col.default).toBe("false");
  });

  it("jsonb column (binary: true)", () => {
    const col = UserSchema.toTableSchema().columns.find(
      (c) => c.name === "metadata",
    )!;
    expect(col.type).toBe("jsonb");
    expect(col.nullable).toBe(true);
  });

  it("numeric column carries precision and scale", () => {
    const col = ProductSchema.toTableSchema().columns.find(
      (c) => c.name === "price",
    )!;
    expect(col.type).toBe("numeric");
    expect(col.length).toBe(10);
    expect(col.scale).toBe(2);
  });

  it("integer column with integer default value", () => {
    const col = ProductSchema.toTableSchema().columns.find(
      (c) => c.name === "stock",
    )!;
    expect(col.type).toBe("integer");
    expect(col.default).toBe("0");
  });

  it("enum column emits type enum and enum name reference", () => {
    const col = ProductSchema.toTableSchema().columns.find(
      (c) => c.name === "status",
    )!;
    expect(col.type).toBe("enum");
    expect(col.enum).toBe("product_status");
  });

  it("array text column is flagged as array and nullable", () => {
    const col = ProductSchema.toTableSchema().columns.find(
      (c) => c.name === "tags",
    )!;
    expect(col.array).toBe(true);
    expect(col.nullable).toBe(true);
  });

  it("json column (no binary option) uses json type", () => {
    const col = ProductSchema.toTableSchema().columns.find(
      (c) => c.name === "specs",
    )!;
    expect(col.type).toBe("json");
  });

  it("timestamp with timezone on product uses correct type", () => {
    const col = ProductSchema.toTableSchema().columns.find(
      (c) => c.name === "createdAt",
    )!;
    expect(col.type).toBe("timestamp with time zone");
  });
});
