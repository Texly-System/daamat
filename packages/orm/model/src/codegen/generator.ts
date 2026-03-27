import { ModuleSchema } from "@/types";
import { toPascalCase, toEnumTypeName } from "@/utils/stringConvertor";
import { GenerateTypesOptions, GeneratedFilesMap } from "./utils/typeOptions";
import { DEFAULT_AUTO_FIELDS } from "./defaults";
import { buildRelationMap } from "./relationMap";
import {
  generateEnumTypes,
  generateEnumsFile,
  getTableEnums,
} from "./utils/enum";
import { generateRowInterface } from "./utils/rowInterface";
import { generateNewType } from "./utils/newType";
import { generateUpdateType } from "./utils/updateType";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Derive the filename stem (no extension) for a table.
 * `order_item` → `order-item`, `product` → `product`.
 */
function tableToFileName(tableName: string): string {
  return tableName.replace(/_/g, "-");
}

/**
 * Collect the PascalCase type names of every relation target referenced by a
 * table so we can build the correct import statements.
 *
 * Returns an array of `{ typeName, fileName }` pairs where `fileName` is the
 * stem (without `.ts`) of the file that exports the related type.
 */
function getRelationImports(
  tableName: string,
  schema: ModuleSchema,
): Array<{ typeName: string; fileName: string }> {
  const rels = schema.relationships ?? [];
  const tableRels = rels.filter((r) => r.from === tableName);

  return tableRels.map((rel) => ({
    typeName: toPascalCase(rel.to),
    fileName: tableToFileName(rel.to),
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate TypeScript type declarations for an entire `ModuleSchema` as a
 * **single file** string.
 *
 * Produces four things per model:
 *   1. `export interface Product { ... }`         — full row shape
 *   2. `export type NewProduct = { ... }`         — insert payload (defaults optional)
 *   3. `export type UpdateProduct = Partial<...>` — partial update payload
 *   4. Optional loaded-relation fields on the row interface
 *
 * Plus one `export type` per enum at the top of the file.
 *
 * The return value is the full contents of a `.ts` file ready to be written
 * to disk.  No imports are emitted — every type is self-contained.
 *
 * ```ts
 * import { toModuleSchema } from "@damatjs/orm-model";
 * import { generateTypes } from "@damatjs/orm-model/codegen";
 * import { writeFileSync } from "fs";
 *
 * const schema = toModuleSchema("store", [UserSchema, OrderSchema]);
 * writeFileSync("src/generated/types.ts", generateTypes(schema));
 * ```
 */
export function generateTypes(
  schema: ModuleSchema,
  options: GenerateTypesOptions = {},
): string {
  const autoFields = new Set([
    ...DEFAULT_AUTO_FIELDS,
    ...(options.autoFields ?? []),
  ]);

  const banner =
    options.banner === false
      ? null
      : (options.banner ??
        "// This file is auto-generated. Do not edit it manually.\n" +
          "// Re-generate by running: bun run codegen\n");

  const relationMap = buildRelationMap(schema.relationships ?? []);

  const sections: string[][] = [];

  // ── Enums ─────────────────────────────────────────────────────────────────
  const enumLines = generateEnumTypes(schema);
  if (enumLines.length > 0) {
    sections.push(enumLines);
  }

  // ── Per-table types ───────────────────────────────────────────────────────
  for (const table of schema.tables) {
    const rels = relationMap.get(table.name) ?? [];

    sections.push(generateRowInterface(table, rels));
    sections.push(generateNewType(table, autoFields));
    sections.push(generateUpdateType(table));
  }

  const body = sections.map((s) => s.join("\n")).join("\n\n");

  return banner ? `${banner}\n${body}\n` : `${body}\n`;
}

/**
 * Generate TypeScript type declarations for a single table as a self-contained
 * `.ts` file string.
 *
 * The file will:
 *   - Import enum type aliases used by this table's columns from `./enums`
 *     (only when the module has enums — keeps zero-enum modules clean).
 *   - Import related row types (from `belongsTo` / `hasMany` / `hasOne`
 *     relations) from their own sibling files.
 *   - Export `interface <Table>`, `type New<Table>`, and `type Update<Table>`.
 *
 * @param table       The single table from the `ModuleSchema`.
 * @param schema      The full `ModuleSchema` (needed for enum + relation lookups).
 * @param autoFields  Set of column names to omit from the `New*` type.
 * @param banner      Optional banner string, or `null` to omit.
 */
export function generateTableFile(
  table: ModuleSchema["tables"][number],
  schema: ModuleSchema,
  autoFields: Set<string>,
  banner: string | null,
): string {
  const allEnums = schema.enums ?? [];
  const rels = (schema.relationships ?? []).filter(
    (r) => r.from === table.name,
  );

  // ── Enum imports from ./enums ────────────────────────────────────────────
  // Only emit when this table actually uses enums (and the module has them).
  const tableEnums = getTableEnums(table, allEnums);
  const enumImportLine =
    tableEnums.length > 0
      ? `import type { ${tableEnums.map((e) => toEnumTypeName(e.name)).join(", ")} } from "./enums";`
      : null;

  // ── Imports for related row types ────────────────────────────────────────
  const relImports = getRelationImports(table.name, schema);
  // Deduplicate (a table could appear in multiple relations)
  const seen = new Set<string>();
  const uniqueRelImports = relImports.filter(({ typeName }) => {
    if (seen.has(typeName)) return false;
    seen.add(typeName);
    return true;
  });

  const relImportLines = uniqueRelImports.map(
    ({ typeName, fileName }) =>
      `import type { ${typeName} } from "./${fileName}";`,
  );

  // ── Build sections ───────────────────────────────────────────────────────
  const sections: string[][] = [];

  // Collect all import lines together in one block at the top
  const allImportLines = [
    ...(enumImportLine ? [enumImportLine] : []),
    ...relImportLines,
  ];
  if (allImportLines.length > 0) {
    sections.push(allImportLines);
  }

  sections.push(generateRowInterface(table, rels));
  sections.push(generateNewType(table, autoFields));
  sections.push(generateUpdateType(table));

  const body = sections.map((s) => s.join("\n")).join("\n\n");

  return banner ? `${banner}\n${body}\n` : `${body}\n`;
}

/**
 * Generate a complete set of `.ts` files — one per table, a dedicated
 * `enums.ts` (when the module has enums), and an `index.ts` barrel that
 * re-exports everything — for an entire `ModuleSchema`.
 *
 * Returns a `Map<fileName, fileContent>` where the keys are relative file
 * names (e.g. `"enums.ts"`, `"product.ts"`, `"order-item.ts"`, `"index.ts"`).
 * The caller is responsible for writing them to disk.
 *
 * ```ts
 * const files = generateFilesMap(schema);
 * for (const [name, content] of files) {
 *   writeFileSync(join(outDir, name), content, "utf8");
 * }
 * ```
 */
export function generateFilesMap(
  schema: ModuleSchema,
  options: GenerateTypesOptions = {},
): GeneratedFilesMap {
  const autoFields = new Set([
    ...DEFAULT_AUTO_FIELDS,
    ...(options.autoFields ?? []),
  ]);

  const banner =
    options.banner === false
      ? null
      : (options.banner ??
        "// This file is auto-generated. Do not edit it manually.\n" +
          "// Re-generate by running: bun run codegen\n");

  const result: GeneratedFilesMap = new Map();

  // ── enums.ts (only when the module has enums) ────────────────────────────
  const hasEnums = (schema.enums ?? []).length > 0;
  if (hasEnums) {
    result.set("enums.ts", generateEnumsFile(schema, banner)!);
  }

  // ── One file per table ───────────────────────────────────────────────────
  for (const table of schema.tables) {
    const fileName = `${tableToFileName(table.name)}.ts`;
    result.set(fileName, generateTableFile(table, schema, autoFields, banner));
  }

  // ── index.ts barrel ─────────────────────────────────────────────────────
  const exportLines: string[] = [];

  if (hasEnums) {
    exportLines.push(`export * from "./enums";`);
  }
  for (const table of schema.tables) {
    exportLines.push(`export * from "./${tableToFileName(table.name)}";`);
  }

  const indexBody = exportLines.join("\n");
  result.set(
    "index.ts",
    banner ? `${banner}\n${indexBody}\n` : `${indexBody}\n`,
  );

  return result;
}
