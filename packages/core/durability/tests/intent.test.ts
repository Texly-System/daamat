import { describe, expect, test } from "bun:test";
import { canonicalJson, intentFingerprint } from "../src";

describe("canonical durable intent", () => {
  test("sorts object keys, preserves arrays, and normalizes dates", () => {
    const left = { z: [2, 1], at: new Date("2026-01-02T03:04:05.000Z"), a: 1 };
    const right = { a: 1, at: "2026-01-02T03:04:05.000Z", z: [2, 1] };
    expect(canonicalJson(left)).toBe(canonicalJson(right));
    expect(canonicalJson([null, true])).toBe("[null,true]");
    expect(intentFingerprint(left)).toMatch(/^[a-f0-9]{64}$/);
  });

  test("rejects non-JSON and cyclic values", () => {
    expect(() => canonicalJson({ value: 1n })).toThrow("non-JSON bigint");
    expect(() => canonicalJson({ value: Number.NaN })).toThrow("finite");
    expect(() => canonicalJson(new Date(Number.NaN))).toThrow("invalid Date");
    expect(() => canonicalJson(new Map())).toThrow("plain JSON objects");
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => canonicalJson(cyclic)).toThrow("cycle");
  });
});
