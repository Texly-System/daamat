const shared = ["001", "002", "003", "004", "005"]
  .map((id) => `@damatjs/durability:${id}`);
const jobs = ["001", "002", "003", "004"]
  .map((id) => `@damatjs/jobs:${id}`);
const events = ["001", "002", "003", "004", "005", "006"]
  .map((id) => `@damatjs/events:${id}`);
const pipelines = ["001", "002"]
  .map((id) => `@damatjs/pipelines:${id}`);

export const jobSystemMigrations = [
  ...shared,
  ...jobs,
  "@damatjs/durability:006",
  "@damatjs/jobs:005",
];

export const eventSystemMigrations = [
  ...shared,
  ...events,
  "@damatjs/durability:006",
  "@damatjs/events:007",
];

export const jobEventSystemMigrations = [
  ...shared,
  ...jobs,
  ...events,
  "@damatjs/durability:006",
  "@damatjs/jobs:005",
  "@damatjs/events:007",
];

export const pipelineSystemMigrations = [
  ...shared,
  ...jobs,
  ...pipelines,
  "@damatjs/durability:006",
  "@damatjs/jobs:005",
  "@damatjs/pipelines:003",
];
