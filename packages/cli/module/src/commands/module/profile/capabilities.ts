import type { ProvidedCapability } from "@damatjs/installer";

export function moduleCapabilities(
  prefix = "",
): Record<string, ProvidedCapability> {
  const path = (value: string) => `${prefix}${value}`;
  return {
    module: { from: path("**"), fallbackTo: "src/modules/{id}" },
    routes: {
      from: path("api/routes/**"),
      fallbackTo: "src/api/routes/{id}",
    },
    workflows: {
      from: path("workflows/**"),
      fallbackTo: "src/workflows/{id}",
    },
    jobs: { from: path("jobs/**"), fallbackTo: "src/jobs/{id}" },
    events: { from: path("events/**"), fallbackTo: "src/events/{id}" },
    pipelines: {
      from: path("pipelines/**"),
      fallbackTo: "src/pipelines/{id}",
    },
    links: { from: path("links/**"), fallbackTo: "src/links/{id}" },
    tests: { from: "tests/**", fallbackTo: "tests/modules/{id}" },
    migrations: {
      from: path("migrations/**"),
      fallbackTo: "src/modules/{id}/migrations",
    },
    models: { from: path("models/**"), fallbackTo: "src/modules/{id}/models" },
    types: { from: path("types/**"), fallbackTo: "src/modules/{id}/types" },
  };
}
