import { describe, it, expect } from "bun:test";
import { columns } from "@/properties";
import { ColumnBuilder } from "@/properties/column/base";

function tsOf(builder: ColumnBuilder): string {
  (builder as unknown as { _setName(name: string): void })._setName("c");
  return builder.toTsType();
}

describe("ColumnBuilder.toTsType › scalar nullability", () => {
  it("non-null scalar is the bare base type", () => {
    expect(tsOf(columns.integer())).toBe("number");
  });
  it("nullable scalar appends | null", () => {
    expect(tsOf(columns.integer().nullable())).toBe("number | null");
  });
  it("text non-null is string", () => {
    expect(tsOf(columns.text())).toBe("string");
  });
});

describe("ColumnBuilder.toTsType › array wrapping", () => {
  it("array wraps the base in Array<>", () => {
    expect(tsOf(columns.text().array())).toBe("Array<string>");
  });
  it("nullable array applies | null after the wrapper", () => {
    expect(tsOf(columns.text().array().nullable())).toBe("Array<string> | null");
  });
});

describe("ColumnBuilder.toTsType › object-literal bases", () => {
  it("point non-null is its object literal", () => {
    expect(tsOf(new ColumnBuilder("point"))).toBe("{ x: number; y: number }");
  });
  it("point nullable keeps the literal", () => {
    expect(tsOf(new ColumnBuilder("point").nullable())).toBe(
      "{ x: number; y: number } | null",
    );
  });
  it("interval nullable and arrays retain their object shape", () => {
    expect(tsOf(columns.interval().nullable())).toContain("years: number");
    expect(tsOf(columns.interval().array())).toMatch(/^Array<\{ years: number/);
  });
});

describe("ColumnBuilder.toTsType › union bases", () => {
  function unionEnum(options: { array?: boolean; nullable?: boolean } = {}) {
    const builder = new ColumnBuilder("enum") as ColumnBuilder & {
      _enumTsType?: string;
      _array: boolean;
      _nullable: boolean;
    };
    builder._enumTsType = "A | B";
    if (options.array) builder._array = true;
    if (options.nullable) builder._nullable = true;
    return builder;
  }

  it("parenthesises nullable top-level unions", () => {
    expect(tsOf(unionEnum({ nullable: true }))).toBe("(A | B) | null");
  });
  it("does not parenthesise unions inside Array<>", () => {
    expect(tsOf(unionEnum({ array: true, nullable: true }))).toBe(
      "Array<A | B> | null",
    );
  });
  it("keeps range unions nested inside the object", () => {
    const value = tsOf(new ColumnBuilder("int4range").nullable());
    expect(value.startsWith("(")).toBe(false);
    expect(value.endsWith("} | null")).toBe(true);
  });
});
