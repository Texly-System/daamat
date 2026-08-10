import type { SchemaChange, SchemaDiff } from "../types";

/** Build a human-readable summary of a schema diff. */
export function generateDescription(diff: SchemaDiff): string {
  const counts: Partial<Record<SchemaChange["type"], number>> = {};
  for (const change of diff.changes) {
    counts[change.type] = (counts[change.type] ?? 0) + 1;
  }
  const label = (count: number | undefined, one: string, many: string) =>
    count ? `${count} ${count === 1 ? one : many}` : null;
  const parts = [
    label(counts.create_extension, "extension created", "extensions created"),
    label(counts.create_table, "table created", "tables created"),
    label(counts.drop_table, "table dropped", "tables dropped"),
    label(counts.rename_table, "table renamed", "tables renamed"),
    label(counts.add_column, "column added", "columns added"),
    label(counts.drop_column, "column dropped", "columns dropped"),
    label(counts.alter_column, "column altered", "columns altered"),
    label(counts.rename_column, "column renamed", "columns renamed"),
    label(counts.add_index, "index added", "indexes added"),
    label(counts.drop_index, "index dropped", "indexes dropped"),
    label(counts.add_foreign_key, "foreign key added", "foreign keys added"),
    label(counts.drop_foreign_key, "foreign key dropped", "foreign keys dropped"),
    label(counts.add_constraint, "constraint added", "constraints added"),
    label(counts.drop_constraint, "constraint dropped", "constraints dropped"),
    label(counts.create_enum, "enum created", "enums created"),
    label(counts.drop_enum, "enum dropped", "enums dropped"),
    label(counts.alter_enum, "enum altered", "enums altered"),
  ].filter(Boolean);
  return parts.join(", ") || "No changes";
}
