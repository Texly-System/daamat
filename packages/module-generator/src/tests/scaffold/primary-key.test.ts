import { expect, test } from "bun:test";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateCrudScaffold } from "../../scaffold";
import { deriveNames } from "../../scaffold/naming";
import { stepCreate } from "../../scaffold/templates/step";

const customTable = {
  name: "sections",
  columns: [
    { name: "section_id", type: "text" as const, nullable: false, primaryKey: true },
    { name: "title", type: "text" as const, nullable: false },
  ],
};

const compositeTable = {
  name: "section_titles",
  columns: [
    { name: "section_id", type: "text" as const, nullable: false },
    { name: "ordinal", type: "integer" as const, nullable: false },
    { name: "title", type: "text" as const, nullable: false },
  ],
  constraints: [
    {
      name: "section_titles_pkey",
      type: "primary_key" as const,
      columns: ["section_id", "ordinal"],
    },
  ],
};

test("derives a custom single-column key for CRUD", () => {
  const names = deriveNames("catalog", customTable);
  expect(names.pk).toBe("section_id");
  expect(names.pkColumns).toEqual(["section_id"]);
  expect(names.supportsById).toBe(true);
  expect(stepCreate(names, "@catalog/types")).toContain(
    "where: { section_id: created.section_id }",
  );
});

test("ignores a primary-key constraint that names an absent column", () => {
  const names = deriveNames("catalog", {
    name: "sections",
    columns: [{ name: "title", type: "text", nullable: false }],
    constraints: [
      {
        name: "sections_pkey",
        type: "primary_key",
        columns: ["missing_id"],
      },
    ],
  });
  expect(names.pkColumns).toEqual([]);
  expect(names.pk).toBe("id");
  expect(names.supportsById).toBe(false);
});

test("omits by-id scaffolding for a composite primary key", () => {
  const names = deriveNames("catalog", compositeTable);
  expect(names.pkColumns).toEqual(["section_id", "ordinal"]);
  expect(names.supportsById).toBe(false);

  const root = mkdtempSync(join(tmpdir(), "module-generator-pk-"));
  const result = generateCrudScaffold({ moduleName: "catalog", tables: [compositeTable] }, {
    moduleId: "catalog",
    routesRoot: join(root, "api", "routes"),
    workflowsRoot: join(root, "workflows"),
    typesDir: join(root, "types"),
  });

  expect(result.created).toHaveLength(9);
  expect(result.created.some((path) => path.includes("[id]"))).toBe(false);
  expect(result.created.some((path) => path.includes("updateSectionTitles"))).toBe(false);
  expect(result.created.some((path) => path.includes("deleteSectionTitles"))).toBe(false);
  expect(result.created.some((path) => path.includes("findSectionTitles"))).toBe(false);
  expect(existsSync(join(root, "workflows", "sectionTitles", "steps", "createSectionTitles.ts"))).toBe(true);
});
