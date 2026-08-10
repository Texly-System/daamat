export interface RecordedQuery {
  sql: string;
  params?: unknown[];
}

export function makeFakePool(
  rowsFor:
    | Record<string, unknown>[]
    | ((sql: string, params?: unknown[]) => Record<string, unknown>[])
    | undefined = undefined,
) {
  const queries: RecordedQuery[] = [];
  const pool = {
    query: async (sql: string, params?: unknown[]) => {
      queries.push({ sql, params });
      const rows = Array.isArray(rowsFor)
        ? rowsFor
        : rowsFor
          ? rowsFor(sql, params)
          : [];
      return { rows, rowCount: rows.length };
    },
  };
  return { pool: pool as any, queries };
}

export const norm = (sql: string) => sql.replace(/\s+/g, " ").trim();
