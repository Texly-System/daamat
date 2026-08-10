import { describe, expect, it } from "bun:test";
import { columns } from "@/properties";
import { model } from "@/schema";

const names = (table: string, properties: Record<string, any>) =>
  model(table, properties).toTableSchema().columns.map((column) => column.name);

describe("model auto columns", () => {
  it("appends timestamps and soft delete by default", () => {
    expect(names("auto_default", { id: columns.id().primaryKey() })).toEqual([
      "id", "created_at", "updated_at", "deleted_at",
    ]);
  });
  it("uses non-null timestamptz defaults for both timestamps", () => {
    const columnsOut = model("auto_ts", { id: columns.id().primaryKey() })
      .toTableSchema().columns;
    const created = columnsOut.find((column) => column.name === "created_at")!;
    const updated = columnsOut.find((column) => column.name === "updated_at")!;
    expect(created).toMatchObject({ type: "timestamp with time zone", nullable: false, default: "now()" });
    expect(updated).toMatchObject({ type: "timestamp with time zone", nullable: false, default: "now()" });
  });
  it("uses a nullable timestamp for deleted_at", () => {
    const deleted = model("auto_sd", { id: columns.id().primaryKey() })
      .toTableSchema().columns.find((column) => column.name === "deleted_at")!;
    expect(deleted).toMatchObject({ type: "timestamp with time zone", nullable: true });
    expect(deleted.default).toBeUndefined();
  });
  it("supports timestamps and soft-delete toggles", () => {
    expect(names("no_ts", { id: columns.id().primaryKey() })).toEqual(["id", "created_at", "updated_at", "deleted_at"]);
    expect(model("no_ts_disabled", { id: columns.id().primaryKey() }).timestamps(false).toTableSchema().columns.map((c) => c.name)).toEqual(["id", "deleted_at"]);
    expect(model("no_sd", { id: columns.id().primaryKey() }).softDelete(false).toTableSchema().columns.map((c) => c.name)).toEqual(["id", "created_at", "updated_at"]);
  });
  it("supports custom soft-delete fields and avoids duplicates", () => {
    expect(model("custom_sd", { id: columns.id().primaryKey() }).timestamps(false).softDelete(true, "removed_at").toTableSchema().columns.map((c) => c.name)).toEqual(["id", "removed_at"]);
    const explicit = model("explicit_sd", { id: columns.id().primaryKey(), deleted_at: columns.timestamp().nullable() }).timestamps(false).toTableSchema().columns;
    expect(explicit.filter((column) => column.name === "deleted_at")).toHaveLength(1);
  });
  it("recognises explicit camelCase timestamps", () => {
    const result = model("explicit_ts", { id: columns.id().primaryKey(), createdAt: columns.timestamp({ withTimezone: true }).defaultNow() }).softDelete(false).toTableSchema().columns;
    expect(result.filter((column) => column.name === "created_at")).toHaveLength(0);
    expect(result.map((column) => column.name)).toContain("createdAt");
    expect(result.map((column) => column.name)).toContain("updated_at");
  });
  it("toggle methods return the model", () => {
    const value = model("chainable", { id: columns.id().primaryKey() });
    expect(value.timestamps(false)).toBe(value);
    expect(value.softDelete(false)).toBe(value);
  });
});
