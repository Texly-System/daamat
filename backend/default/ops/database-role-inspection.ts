import { Pool } from "@damatjs/deps/pg";

export interface RoleRow {
  userName: string;
  superuser: boolean;
  createDatabase: boolean;
  createRole: boolean;
  createSchema: boolean;
  publicUsage: boolean;
  damatUsage: boolean;
  damatCreate: boolean;
  damatOwner: boolean;
  ownedTables: number;
  writableTables: number;
  tables: number;
  ownedDamatTables: number;
  writableDamatTables: number;
  damatTables: number;
  usableDamatSequences: number;
  damatSequences: number;
}

export async function inspectDatabaseRole(url: string): Promise<RoleRow> {
  const pool = new Pool({ connectionString: url });
  try {
    const result = await pool.query<RoleRow>(`
      SELECT current_user AS "userName", r.rolsuper AS superuser,
        r.rolcreatedb AS "createDatabase", r.rolcreaterole AS "createRole",
        has_schema_privilege(current_user, 'public', 'CREATE') AS "createSchema",
        has_schema_privilege(current_user, 'public', 'USAGE') AS "publicUsage",
        has_schema_privilege(current_user, 'damat', 'USAGE') AS "damatUsage",
        has_schema_privilege(current_user, 'damat', 'CREATE') AS "damatCreate",
        (SELECT pg_has_role(current_user, nspowner, 'USAGE')
           FROM pg_namespace WHERE nspname='damat') AS "damatOwner",
        (SELECT COUNT(*)::int FROM pg_tables WHERE schemaname='public'
          AND tableowner=current_user) AS "ownedTables",
        (SELECT COUNT(*)::int FROM pg_tables WHERE schemaname='public'
          AND has_table_privilege(current_user, schemaname||'.'||tablename, 'SELECT')
          AND has_table_privilege(current_user, schemaname||'.'||tablename, 'INSERT')
          AND has_table_privilege(current_user, schemaname||'.'||tablename, 'UPDATE')
          AND has_table_privilege(current_user, schemaname||'.'||tablename, 'DELETE'))
          AS "writableTables",
        (SELECT COUNT(*)::int FROM pg_tables WHERE schemaname='public') AS tables,
        (SELECT COUNT(*)::int FROM pg_tables WHERE schemaname='damat'
          AND tableowner=current_user) AS "ownedDamatTables",
        (SELECT COUNT(*)::int FROM pg_tables WHERE schemaname='damat'
          AND has_table_privilege(current_user, schemaname||'.'||tablename, 'SELECT')
          AND has_table_privilege(current_user, schemaname||'.'||tablename, 'INSERT')
          AND has_table_privilege(current_user, schemaname||'.'||tablename, 'UPDATE')
          AND has_table_privilege(current_user, schemaname||'.'||tablename, 'DELETE'))
          AS "writableDamatTables",
        (SELECT COUNT(*)::int FROM pg_tables WHERE schemaname='damat')
          AS "damatTables",
        (SELECT COUNT(*)::int FROM pg_sequences WHERE schemaname='damat'
          AND has_sequence_privilege(current_user,
            quote_ident(schemaname)||'.'||quote_ident(sequencename), 'USAGE')
          AND has_sequence_privilege(current_user,
            quote_ident(schemaname)||'.'||quote_ident(sequencename), 'SELECT')
          AND has_sequence_privilege(current_user,
            quote_ident(schemaname)||'.'||quote_ident(sequencename), 'UPDATE'))
          AS "usableDamatSequences",
        (SELECT COUNT(*)::int FROM pg_sequences WHERE schemaname='damat')
          AS "damatSequences"
      FROM pg_roles r WHERE r.rolname=current_user`);
    return result.rows[0]!;
  } finally {
    await pool.end();
  }
}
