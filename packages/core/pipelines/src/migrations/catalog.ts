import type { SystemMigrationCatalog } from "@damatjs/durability";
import { pipelines001 } from "./pipelines-001";
import { pipelines002 } from "./pipelines-002";

export const pipelinesSystemMigrations: SystemMigrationCatalog = {
  owner: "@damatjs/pipelines",
  migrations: [pipelines001, pipelines002],
};
