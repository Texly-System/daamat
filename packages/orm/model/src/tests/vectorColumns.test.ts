import { describe, expect, it } from "bun:test";
import { columns } from "@/properties";
import { ColumnBuilder } from "@/properties/column/base";

function schemaOf(builder: ColumnBuilder) {
  (builder as unknown as { _setName(value: string): void })._setName("embedding");
  return builder.toSchema();
}
function tsOf(builder: ColumnBuilder): string {
  (builder as unknown as { _setName(value: string): void })._setName("embedding");
  return builder.toTsType();
}

describe("native vector columns", () => {
  it("emits VECTOR dimensions without array or length metadata", () => {
    expect(schemaOf(columns.vector(1536))).toMatchObject({
      type: "vector", dimensions: 1536, array: false,
    });
    expect(schemaOf(columns.vector(1536)).length).toBeUndefined();
  });
  it("emits HALFVEC and supports validated updates", () => {
    expect(schemaOf(columns.halfVector(768))).toMatchObject({
      type: "halfvec", dimensions: 768,
    });
    expect(schemaOf(columns.vector(768).dimensions(384)).dimensions).toBe(384);
    expect(() => columns.vector(3).dimensions(-1)).toThrow(/positive integer/);
  });
  it("infers number[] and rejects generic array conversion", () => {
    expect(tsOf(columns.vector(3).nullable())).toBe("number[] | null");
    expect(() => columns.halfVector(3).array()).toThrow(/cannot be converted/);
  });
  it("rejects zero and fractional dimensions", () => {
    expect(() => columns.vector(0)).toThrow(/positive integer/);
    expect(() => columns.halfVector(1.5)).toThrow(/positive integer/);
  });
});
