import { inspectDatabaseRole } from "./database-role-inspection";

const runtimeUrl = process.env.DATABASE_URL;
const migrationUrl = process.env.MIGRATION_DATABASE_URL;
if (!runtimeUrl || !migrationUrl)
  throw new Error("database acceptance URLs are required");
const runtime = await inspectDatabaseRole(runtimeUrl);
const migration = await inspectDatabaseRole(migrationUrl);
const unsafe = [runtime, migration].some(
  (role) => role.superuser || role.createDatabase || role.createRole,
);
if (unsafe)
  throw new Error("database application roles hold administrative privileges");
if (runtime.createSchema || runtime.ownedTables > 0 || !runtime.publicUsage)
  throw new Error(
    "runtime role has unsafe or incomplete public schema privileges",
  );
if (runtime.damatCreate || runtime.ownedDamatTables > 0 || !runtime.damatUsage)
  throw new Error("runtime role lacks safe Damat schema privileges");
if (
  !migration.createSchema ||
  !migration.damatCreate ||
  !migration.damatUsage ||
  !migration.damatOwner
)
  throw new Error("migration role lacks public or Damat schema privileges");
if (runtime.tables === 0 || runtime.writableTables !== runtime.tables)
  throw new Error("runtime role lacks CRUD grants on migrated tables");
if (
  runtime.damatTables === 0 ||
  runtime.writableDamatTables !== runtime.damatTables
)
  throw new Error("runtime role lacks CRUD grants on Damat tables");
if (runtime.usableDamatSequences !== runtime.damatSequences)
  throw new Error("runtime role lacks privileges on Damat sequences");
console.log(JSON.stringify({ runtime, migration }, null, 2));
