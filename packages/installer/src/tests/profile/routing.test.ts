import { expect, test } from "bun:test";
import {
  createProfileRecipe,
  mapArtifactFiles,
  type DamatManifest,
} from "../../index";
import { tempProject } from "../fixtures/project";

const paths = {
  module: "src/index.ts",
  routes: "src/api/routes/users/route.ts",
  workflows: "src/workflows/users.ts",
  jobs: "src/jobs/report.ts",
  events: "src/events/user-created.ts",
  pipelines: "src/pipelines/onboard.ts",
};

test("routes overlapping capabilities before the broad module mapping", () => {
  const provider: DamatManifest = {
    schemaVersion: 1,
    kind: "module",
    name: "user",
    install: {
      provides: {
        module: { from: "src/**", fallbackTo: "src/modules/{id}" },
        routes: {
          from: "src/api/routes/**",
          fallbackTo: "src/api/routes/{id}",
        },
        workflows: {
          from: "src/workflows/**",
          fallbackTo: "src/workflows/{id}",
        },
        jobs: { from: "src/jobs/**", fallbackTo: "src/jobs/{id}" },
        events: { from: "src/events/**", fallbackTo: "src/events/{id}" },
        pipelines: {
          from: "src/pipelines/**",
          fallbackTo: "src/pipelines/{id}",
        },
      },
    },
  };
  const recipe = createProfileRecipe({ provider });
  const broad = recipe.mappings!.findIndex(({ from }) => from === "src/**");
  expect(
    recipe.mappings!
      .filter(({ from }) => from !== "src/**")
      .every((mapping) => recipe.mappings!.indexOf(mapping) < broad),
  ).toBeTrue();
  const root = tempProject(
    Object.fromEntries(Object.values(paths).map((path) => [path, path])),
  );
  expect(
    Object.fromEntries(
      mapArtifactFiles(root, recipe).map(({ relativeSource, target }) => [
        relativeSource,
        target,
      ]),
    ),
  ).toMatchObject({
    "src/index.ts": "src/modules/user/index.ts",
    "src/api/routes/users/route.ts": "src/api/routes/user/users/route.ts",
    "src/workflows/users.ts": "src/workflows/user/users.ts",
    "src/jobs/report.ts": "src/jobs/user/report.ts",
    "src/events/user-created.ts": "src/events/user/user-created.ts",
    "src/pipelines/onboard.ts": "src/pipelines/user/onboard.ts",
  });
});
