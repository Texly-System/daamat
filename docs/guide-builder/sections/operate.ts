import type { GuideSectionDefinition } from "../types";

export const operateSection: GuideSectionDefinition = {
  id: "operate-and-reference",
  title: "Operate & reference",
  chapters: [
    {
      id: "cli-reference",
      title: "CLI reference",
      summary:
        "Find exact commands for backend workflows: create, migrate, dev loops, install, build, and inspect.",
      file: "18-cli-reference.md",
      order: 18,
    },
    {
      id: "deployment",
      title: "Deployment",
      summary:
        "Deploy confidently with explicit migration jobs, stable runtime roles, and process-mode guardrails.",
      file: "19-deployment.md",
      order: 19,
    },
    {
      id: "deployment-platforms",
      title: "Containers, health, and rollback",
      summary:
        "Split deployment into release, container, and rollback safety paths.",
      file: "19b-deployment-platforms.md",
      order: 19.1,
    },
    {
      id: "package-reference",
      title: "Package reference",
      summary:
        "Jump straight to package APIs and internal docs from the same navigation tree as the guide.",
      file: "20-package-reference.md",
      order: 20,
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      summary:
        "Resolve startup, runtime, migration, and durability issues quickly with symptom-first checklists.",
      file: "21-troubleshooting.md",
      order: 21,
    },
    {
      id: "troubleshooting-runtime",
      title: "Runtime and durability faults",
      summary:
        "Diagnose pipeline, jobs, events, Redis, and startup signal issues.",
      file: "21b-troubleshooting-runtime.md",
      order: 21.1,
    },
    {
      id: "troubleshooting-tooling",
      title: "Tooling and build faults",
      summary:
        "Resolve module, MCP, and toolchain issues with command-first diagnostics.",
      file: "21c-troubleshooting-tooling.md",
      order: 21.2,
    },
  ],
};
