import { describe, expect, it } from "bun:test";
import type { ColumnSchema } from "@damatjs/orm-type";
import { columnToTsType } from "../../columnToTsType";
import { columnToZodSchema } from "../../columnToZodSchema";
import { vectorDimensions } from "../../vector";

const column = (
  type: "vector" | "halfvec",
  dimensions?: number,
): ColumnSchema => ({
  name: "embedding",
  type,
  nullable: false,
  dimensions,
});

describe("native vector column mapping", () => {
  it("maps vector and halfvec to number arrays", () => {
    expect(columnToTsType(column("vector", 1536))).toBe("number[]");
    expect(columnToTsType(column("halfvec", 2048))).toBe("number[]");
    expect(columnToZodSchema(column("vector", 1536))).toBe(
      "z.array(z.number().finite()).length(1536)",
    );
  });

  it("keeps ordinary PostgreSQL arrays on the existing wrapper path", () => {
    expect(
      columnToZodSchema({
        name: "samples",
        type: "real",
        nullable: false,
        array: true,
      }),
    ).toBe("z.array(z.number())");
  });

  it("rejects missing or invalid vector dimensions", () => {
    for (const dimensions of [undefined, 0, -1, 1.5, Number.NaN]) {
      expect(() => columnToTsType(column("vector", dimensions))).toThrow(
        /positive integer dimensions/,
      );
      expect(() => columnToZodSchema(column("halfvec", dimensions))).toThrow(
        /positive integer dimensions/,
      );
    }
  });

  it("rejects vector arrays and non-vector metadata passed to the helper", () => {
    expect(() =>
      vectorDimensions({
        name: "samples",
        type: "real",
        nullable: false,
      }),
    ).toThrow(/not a native vector/);
    expect(() =>
      vectorDimensions({
        name: "embedding",
        type: "vector",
        nullable: false,
        dimensions: 3,
        array: true,
      }),
    ).toThrow(/cannot be an array/);
  });
});
