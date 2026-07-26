import { createHash } from "node:crypto";

function canonicalize(value: unknown, seen: Set<object>): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError("Intent numbers must be finite");
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    throw new TypeError(`Intent contains a non-JSON ${typeof value} value`);
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime()))
      throw new TypeError("Intent contains an invalid Date");
    return JSON.stringify(value.toISOString());
  }
  if (seen.has(value)) throw new TypeError("Intent contains a cycle");
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => canonicalize(item, seen)).join(",")}]`;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Intent objects must be plain JSON objects");
    }
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(object[key], seen)}`)
      .join(",")}}`;
  } finally {
    seen.delete(value);
  }
}

export function canonicalJson(value: unknown): string {
  return canonicalize(value, new Set());
}

export function intentFingerprint(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}
