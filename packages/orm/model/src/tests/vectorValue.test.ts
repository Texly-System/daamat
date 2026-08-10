import { describe, expect, it } from "bun:test";
import {
  assertColumnVectorValue,
  assertVectorValue,
  isVectorColumn,
} from "@/utils";

describe("vector value validation", () => {
  it("accepts exact finite numeric values", () => {
    expect(() => assertVectorValue([1, -2.5, 0], 3, "embedding")).not.toThrow();
  });

  it("reports dimension, array, type, and finite failures", () => {
    expect(() => assertVectorValue([1], 2, "embedding")).toThrow(/exactly 2/);
    expect(() => assertVectorValue("1,2", 2, "embedding")).toThrow(/array/);
    expect(() => assertVectorValue([1, "2"], 2, "embedding")).toThrow(/\[1\]/);
    expect(() => assertVectorValue([1, Number.NaN], 2, "embedding")).toThrow(
      /finite/,
    );
    expect(() => assertVectorValue([1, Number.POSITIVE_INFINITY], 2)).toThrow(
      /finite/,
    );
    expect(() => assertVectorValue([1], 0)).toThrow(/positive integer/);
  });

  it("recognizes native vector columns and preserves nullish values", () => {
    expect(isVectorColumn({ type: "vector" })).toBe(true);
    expect(isVectorColumn({ type: "halfvec" })).toBe(true);
    expect(isVectorColumn({ type: "real" })).toBe(false);
    expect(() =>
      assertColumnVectorValue({ name: "embedding", type: "vector", dimensions: 2 }, null),
    ).not.toThrow();
    expect(() =>
      assertColumnVectorValue({ name: "embedding", type: "vector", dimensions: 2 }, [1]),
    ).toThrow(/exactly 2/);
  });
});
