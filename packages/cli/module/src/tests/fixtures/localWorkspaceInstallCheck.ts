import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { moduleAddCommand, modulePlanCommand } from "../../commands/module";

const source = mkdtempSync(join(tmpdir(), "module-workspace-"));
const project = mkdtempSync(join(tmpdir(), "module-backend-"));
const files = {
  "src/index.ts": "export default {};",
  "src/api/routes/users/route.ts": "export const GET = () => {};",
  "src/workflows/users.ts": "export const users = {};",
  "src/jobs/report.ts": "export const report = {};",
  "src/events/user-created.ts": "export const created = {};",
  "src/pipelines/onboard.ts": "export const onboard = {};",
};
for (const [path, body] of Object.entries(files)) {
  mkdirSync(join(source, path, ".."), { recursive: true });
  writeFileSync(join(source, path), body);
}
const capabilities = {
  module: { from: "src/**", fallbackTo: "src/modules/{id}" },
  routes: { from: "src/api/routes/**", fallbackTo: "src/api/routes/{id}" },
  workflows: { from: "src/workflows/**", fallbackTo: "src/workflows/{id}" },
  jobs: { from: "src/jobs/**", fallbackTo: "src/jobs/{id}" },
  events: { from: "src/events/**", fallbackTo: "src/events/{id}" },
  pipelines: { from: "src/pipelines/**", fallbackTo: "src/pipelines/{id}" },
};
writeFileSync(
  join(source, "damat.json"),
  JSON.stringify({
    schemaVersion: 1,
    kind: "module",
    name: "local-workspace",
    install: { provides: capabilities },
    module: { entry: "./src/index.ts" },
  }),
);
mkdirSync(join(source, "node_modules/.bin"), { recursive: true });
const dependencyLink = join(source, "node_modules/.bin/damat");
symlinkSync(join(source, "src/index.ts"), dependencyLink);
const messages: string[] = [];
const logger = {
  debug() {},
  success() {},
  skip() {},
  warn(message: string) {
    messages.push(message);
  },
  error(message: string) {
    messages.push(message);
  },
  info(message: string, data?: unknown) {
    messages.push(`${message}${data ? JSON.stringify(data) : ""}`);
  },
};
const context = {
  command: "module",
  args: [source],
  options: { "allow-unverified": true },
  logger,
  cwd: project,
};
const planned = await modulePlanCommand.handler(context);
const added = await moduleAddCommand.handler(context);
const expected = [
  "src/modules/local-workspace/index.ts",
  "src/api/routes/local-workspace/users/route.ts",
  "src/workflows/local-workspace/users.ts",
  "src/jobs/local-workspace/report.ts",
  "src/events/local-workspace/user-created.ts",
  "src/pipelines/local-workspace/onboard.ts",
];
const lock = JSON.parse(readFileSync(join(project, "damat.lock.json"), "utf8"));
const owned = lock.installations["local-workspace"].files.map(
  (file: { path: string }) => file.path,
);
postMessage({
  planned: planned.exitCode === 0,
  added: added.exitCode === 0,
  installed: expected.every((path) => existsSync(join(project, path))),
  owned: expected.every((path) => owned.includes(path)),
  dependencyLinkPreserved: lstatSync(dependencyLink).isSymbolicLink(),
  operations: messages.some((message) => message.includes('"operations":6')),
});
