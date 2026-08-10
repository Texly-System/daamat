import { describe, expect, it } from "bun:test";
import { columns } from "@/properties";
import { EnumBuilder } from "@/properties/enum/base";
import { ColumnBuilder } from "@/properties/column/base";

function schemaOf(builder: ColumnBuilder, name = "c") {
  (builder as unknown as { _setName(value: string): void })._setName(name);
  return builder.toSchema();
}
function tsOf(builder: ColumnBuilder): string {
  (builder as unknown as { _setName(value: string): void })._setName("c");
  return builder.toTsType();
}

describe("enum column TypeScript names", () => {
  const status = new EnumBuilder(["a", "b"]).name("Status");
  it("references the enum name", () => {
    expect(tsOf(columns.enum(status))).toBe("Status");
  });
  it("supports nullable and array enum values", () => {
    expect(tsOf(columns.enum(status).nullable())).toBe("Status | null");
    expect(tsOf(columns.enum(status).array())).toBe("Array<Status>");
  });
});

describe("ColumnBuilder.toSchema defaults and flags", () => {
  it("quotes string and preserves raw defaults", () => {
    expect(schemaOf(columns.text().default("hi")).default).toBe("'hi'");
    expect(schemaOf(columns.timestamp().defaultRaw("now()")).default).toBe("now()");
  });
  it("stringifies numeric and boolean defaults", () => {
    expect(schemaOf(columns.integer().default(0)).default).toBe("0");
    expect(schemaOf(columns.boolean().default(false)).default).toBe("false");
  });
  it("emits flags, fieldName, and independent primary/unique values", () => {
    const value = schemaOf(columns.text().primaryKey().unique().fieldName("db_col"));
    expect(value).toMatchObject({ primaryKey: true, unique: true, array: false });
    expect(value.fieldName).toBe("db_col");
  });
});

describe("specialised column builders", () => {
  it("id and uuid defaults are typed correctly", () => {
    expect(schemaOf(columns.id({ prefix: "usr" }).primaryKey(), "id")).toMatchObject({
      type: "text", default: "generate_id('usr')", primaryKey: true,
    });
    expect(schemaOf(columns.uuid()).type).toBe("uuid");
  });
  it("numeric, binary, character, and JSON builders retain metadata", () => {
    expect(schemaOf(columns.numeric(12, 2))).toMatchObject({ type: "numeric", length: 12, scale: 2 });
    expect(schemaOf(columns.bytea()).type).toBe("bytea");
    expect(schemaOf(columns.char(10))).toMatchObject({ type: "character", length: 10 });
    expect(schemaOf(columns.jsonb()).type).toBe("jsonb");
  });
});
