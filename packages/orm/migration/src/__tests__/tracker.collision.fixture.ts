export interface CollisionRow {
  id: string;
  module: string;
  name: string;
  status: string;
}

export function makeStatefulPool() {
  const rows: CollisionRow[] = [];
  const pool = {
    query: async (sql: string, params: unknown[] = []) => {
      if (/INSERT INTO (?:"damat"\.)?"_damat_migration_logs"/.test(sql)) {
        const [id, module, name] = params as [string, string, string];
        const target = /ON CONFLICT \(([^)]+)\)/
          .exec(sql)![1]!
          .split(",")
          .map((column) => column.trim());
        const incoming: CollisionRow = { id, module, name, status: "applied" };
        const match = rows.find((row) =>
          target.every(
            (column) =>
              row[column as keyof CollisionRow] ===
              incoming[column as keyof CollisionRow],
          ),
        );
        if (match) {
          match.status = "applied";
          return { rows: [], rowCount: 1 };
        }
        if (rows.some((row) => row.id === id)) {
          throw new Error(
            `duplicate key value violates unique constraint (id=${id})`,
          );
        }
        if (rows.some((row) => row.module === module && row.name === name)) {
          throw new Error("duplicate key value violates UNIQUE(module, name)");
        }
        rows.push(incoming);
        return { rows: [], rowCount: 1 };
      }
      if (/status = 'applied'/.test(sql)) {
        const module = params[0] as string | undefined;
        const matched = rows.filter(
          (row) =>
            row.status === "applied" && (!module || row.module === module),
        );
        return { rows: matched, rowCount: matched.length };
      }
      return { rows: [], rowCount: 0 };
    },
  };
  return { pool: pool as any, rows };
}
