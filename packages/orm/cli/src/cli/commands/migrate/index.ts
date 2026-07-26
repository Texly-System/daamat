import type { Command } from "@damatjs/cli";
import migrateUp from "./up";
import migrateStatus from "./status";
import migrateList from "./list";
import migrateCreate from "./create";
import migrateAdopt from "./adopt";

const migrateCommand: Command = {
  name: "migrate",
  description: "Database migration commands",
  subcommands: [
    migrateUp,
    migrateStatus,
    migrateList,
    migrateCreate,
    migrateAdopt,
  ],
  handler: async (ctx) => {
    ctx.logger.info(
      "Available migrate subcommands: up, status, list, create, adopt",
    );
    return { exitCode: 0 };
  },
};

export default migrateCommand;
