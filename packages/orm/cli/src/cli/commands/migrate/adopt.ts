import { type Command, reportError } from "@damatjs/cli";
import { loadDatabaseUrl, loadModules } from "@/cli/utils/load";

const migrateAdopt: Command = {
  name: "migrate:adopt",
  description: "Adopt a committed non-transactional migration",
  usage:
    "<module> <migration> --checksum <sha256> --actor <actor> --reason <reason>",
  options: [
    {
      name: "checksum",
      description: "Exact migration SHA-256",
      required: true,
    },
    { name: "actor", description: "Adopting operator", required: true },
    { name: "reason", description: "Adoption reason", required: true },
  ],
  handler: async (ctx) => {
    const [moduleName, migrationName] = ctx.args;
    if (!moduleName || !migrationName) {
      ctx.logger.error("Module and migration names are required");
      return { exitCode: 1 };
    }
    try {
      const modules = await loadModules("damat.config.ts", ctx.cwd);
      const module = modules[moduleName];
      if (!module)
        throw new Error(`Module '${moduleName}' not found in config`);
      const { databaseUrl } = await loadDatabaseUrl("damat.config.ts", ctx.cwd);
      const { Pool } = await import("@damatjs/deps/pg");
      const { adoptMigration } = await import("@damatjs/orm-migration");
      const pool = new Pool({ connectionString: databaseUrl });
      try {
        await adoptMigration(pool, module, migrationName, {
          checksum: String(ctx.options.checksum),
          actor: String(ctx.options.actor),
          reason: String(ctx.options.reason),
        });
      } finally {
        await pool.end();
      }
      ctx.logger.success(`Adopted ${moduleName}/${migrationName}`);
      return { exitCode: 0 };
    } catch (error) {
      reportError(ctx.logger, error, { prefix: "Failed to adopt migration" });
      return { exitCode: 1 };
    }
  },
};

export default migrateAdopt;
