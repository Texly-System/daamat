import type { SystemMigrationCatalog } from "@damatjs/durability";
import { jobs001 } from "./jobs-001";
import { jobs002 } from "./jobs-002";
import { jobs003 } from "./jobs-003";
import { jobs004 } from "./jobs-004";
import { jobs005 } from "./jobs-005";

export const jobsSystemMigrations: SystemMigrationCatalog = {
  owner: "@damatjs/jobs",
  migrations: [jobs001, jobs002, jobs003, jobs004, jobs005],
};
