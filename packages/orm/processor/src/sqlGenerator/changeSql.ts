import type { SchemaChange, MigrationGeneratorOptions } from "../types";
import { generateCreateExtension } from "./extensions";
import { generateCreateTable, generateDropTable, generateRenameTable } from "./tables";
import { generateAddColumn, generateDropColumn, generateAlterColumn, generateRenameColumn } from "./columns";
import { generateAddIndex, generateDropIndex } from "./indexes";
import { generateAddForeignKeyFromChange, generateDropForeignKey } from "./foreignKeys";
import { generateCreateEnum, generateDropEnum, generateAlterEnum } from "./enums";
import { generateAddConstraint, generateDropConstraint } from "./constraints";

/** Dispatch one schema change to its PostgreSQL SQL generator. */
export function generateChangeSQL(
  change: SchemaChange,
  options: MigrationGeneratorOptions,
): string[] {
  switch (change.type) {
    case "create_extension": return [generateCreateExtension(change, options)];
    case "create_table": return generateCreateTable(change, options).tableStatements;
    case "drop_table": return [generateDropTable(change, options)];
    case "rename_table": return [generateRenameTable(change, options)];
    case "add_column": return [generateAddColumn(change, options)];
    case "drop_column": return [generateDropColumn(change, options)];
    case "alter_column": return generateAlterColumn(change, options);
    case "rename_column": return [generateRenameColumn(change, options)];
    case "add_index": return [generateAddIndex(change, options)];
    case "drop_index": return [generateDropIndex(change, options)];
    case "add_foreign_key": return [generateAddForeignKeyFromChange(change, options)];
    case "drop_foreign_key": return [generateDropForeignKey(change, options)];
    case "add_constraint": return [generateAddConstraint(change, options)];
    case "drop_constraint": return [generateDropConstraint(change, options)];
    case "create_enum": return [generateCreateEnum(change, options)];
    case "drop_enum": return [generateDropEnum(change, options)];
    case "alter_enum": return generateAlterEnum(change, options);
  }
}

export { generateDescription } from "./description";
