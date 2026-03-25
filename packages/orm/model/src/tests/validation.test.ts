import { describe, it, expect } from "bun:test";
import { model } from "@/schema";
import { columns } from "@/properties";
import {
  validateRelations,
  assertValidRelations,
  RelationValidationError,
} from "@/schema/validateRelations";

// ─────────────────────────────────────────────────────────────────────────────
// Relation validation — validateRelations / assertValidRelations
// ─────────────────────────────────────────────────────────────────────────────

describe("transform › relation validation", () => {
  it("validates correct bidirectional relations (no errors)", () => {
    const Child = model("children_v", {
      id: columns.id().primaryKey(),
      parent: columns.belongsTo(() => ParentFinal),
    });
    const ParentFinal = model("parents_v", {
      id: columns.id().primaryKey(),
      children: columns.hasMany(Child).inverse("parent"),
    });
    const result = validateRelations([ParentFinal, Child]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects missing belongsTo for hasMany", () => {
    const Book = model("books_test", {
      id: columns.id().primaryKey(),
      title: columns.text(),
    });
    const Author = model("authors_test", {
      id: columns.id().primaryKey(),
      books: columns.hasMany(Book).inverse("author"),
    });
    const result = validateRelations([Author, Book]);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.errorType).toBe("missing_belongsTo");
    expect(result.errors[0]!.message).toContain('"author"');
  });

  it("detects missing belongsTo for hasOne", () => {
    const Passport = model("passports_test", {
      id: columns.id().primaryKey(),
      number: columns.text(),
    });
    const Person = model("persons_test", {
      id: columns.id().primaryKey(),
      passport: columns.hasOne(Passport).inverse("owner"),
    });
    const result = validateRelations([Person, Passport]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.errorType).toBe("missing_belongsTo");
  });

  it("detects mappedBy pointing to non-belongsTo property", () => {
    const Member = model("members_test", {
      id: columns.id().primaryKey(),
      group: columns.text(),
    });
    const Group = model("groups_test", {
      id: columns.id().primaryKey(),
      members: columns.hasMany(Member).inverse("group"),
    });
    const result = validateRelations([Group, Member]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.errorType).toBe("mappedBy_mismatch");
    expect(result.errors[0]!.message).toContain("is not a belongsTo relation");
  });

  it("detects missing hasMany for belongsTo with inverse", () => {
    const Department = model("departments_test", {
      id: columns.id().primaryKey(),
      name: columns.text(),
    });
    const Employee = model("employees_test", {
      id: columns.id().primaryKey(),
      department: columns.belongsTo(Department).inverse("employees"),
    });
    const result = validateRelations([Department, Employee]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.errorType).toBe("missing_hasMany");
    expect(result.errors[0]!.message).toContain('"employees"');
  });

  it("skips validation for models not in the provided list", () => {
    const Author = model("authors_skip", {
      id: columns.id().primaryKey(),
      books: columns
        .hasMany(() => model("books_skip", { id: columns.id().primaryKey() }))
        .inverse("author"),
    });
    const result = validateRelations([Author]);
    expect(result.valid).toBe(true);
  });

  it("hasMany without inverse skips inverse validation", () => {
    const Folder = model("folders_test", {
      id: columns.id().primaryKey(),
      files: columns.hasMany(() =>
        model("files_test", { id: columns.id().primaryKey() }),
      ),
    });
    const result = validateRelations([Folder]);
    expect(result.valid).toBe(true);
  });

  it("assertValidRelations throws RelationValidationError on first error", () => {
    const B = model("table_b_test", { id: columns.id().primaryKey() });
    const A = model("table_a_test", {
      id: columns.id().primaryKey(),
      bs: columns.hasMany(B).inverse("a"),
    });
    expect(() => assertValidRelations([A, B])).toThrow(RelationValidationError);
  });

  it("assertValidRelations passes silently for valid relations", () => {
    const YWithRelation = model("table_y_final", {
      id: columns.id().primaryKey(),
      x: columns.belongsTo(() => XFinal),
    });
    const XFinal = model("table_x_final", {
      id: columns.id().primaryKey(),
      ys: columns.hasMany(YWithRelation).inverse("x"),
    });
    expect(() => assertValidRelations([XFinal, YWithRelation])).not.toThrow();
  });
});
