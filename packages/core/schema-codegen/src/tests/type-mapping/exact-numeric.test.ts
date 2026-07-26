import { describe, expect, test } from "bun:test";
import type { ColumnSchema } from "@damatjs/orm-type";
import { columnToTsType } from "../../columnToTsType";
import { columnToZodSchema } from "../../columnToZodSchema";

const numeric = (representation?: "number" | "string"): ColumnSchema => ({
  name: "amount",
  type: "numeric",
  nullable: false,
  ...(representation ? { numericRepresentation: representation } : {}),
});

describe("exact numeric representation", () => {
  test("preserves legacy number output when omitted or explicit", () => {
    expect(columnToTsType(numeric())).toBe("number");
    expect(columnToTsType(numeric("number"))).toBe("number");
    expect(columnToZodSchema(numeric())).toBe("z.number()");
  });

  test("generates lossless string types and finite decimal validation", () => {
    expect(columnToTsType(numeric("string"))).toBe("string");
    const source = columnToZodSchema(numeric("string"));
    expect(source).toContain("z.string().regex");
    const decimal = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;
    expect(decimal.test("9007199254740993.123456789")).toBe(true);
    expect(decimal.test("NaN")).toBe(false);
    expect(decimal.test("Infinity")).toBe(false);
  });
});
