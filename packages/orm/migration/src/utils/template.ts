import { GeneratedMigration } from "@damatjs/orm-processor";

/**
 * Get a migration template with auto-generated SQL.
 */
export const getMigrationTemplateWithSQL = (
  className: string,
  name: string,
  moduleName: string,
  timestamp: Date,
  migration: GeneratedMigration,
): string => {
  const upSql =
    migration.upStatements.length > 0
      ? migration.upStatements
          .map((stmt) => stmt + (stmt.trim().endsWith(";") ? "" : ";"))
          .join("\n\n")
      : "-- No changes detected";

  const warningComments =
    migration.warnings.length > 0
      ? migration.warnings.map((w) => `-- WARNING: ${w}`).join("\n") + "\n--\n"
      : "";

  return `-- Migration: ${name}
-- Module: ${moduleName}
-- Created: ${timestamp.toISOString()}
--
-- ${migration.description}
--
${warningComments}-- This migration was auto-generated based on schema changes.
-- Review the SQL statements before running in production.

${upSql}
`;
};
