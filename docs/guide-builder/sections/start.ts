import type { GuideSectionDefinition } from "../types";

export const startSection: GuideSectionDefinition = {
  id: "start-here",
  title: "Start here",
  chapters: [
    {
      id: "introduction",
      title: "Introduction",
      summary:
        "Understand Damat's core idea: modular, TypeScript-first backends built from reusable domain blades.",
    },
    {
      id: "concepts",
      title: "Concepts and architecture",
      summary:
        "Build the mental model for modules, durable work, PostgreSQL truth, Redis acceleration, and runtime role separation.",
    },
    {
      id: "concepts-module-boundaries",
      title: "Module boundaries and portability",
      summary:
        "Separate module-owned behavior from host-owned composition and lifecycle policy.",
      file: "02aa-concepts-module-boundaries.md",
      order: 2.05,
    },
    {
      id: "concepts-execution-primitives",
      title: "Execution primitives",
      summary:
        "Choose among route, workflow, job, event, and pipeline based on durability and restart needs.",
      file: "02ab-concepts-execution-primitives.md",
      order: 2.06,
    },
    {
      id: "composition-and-durability-runtime",
      title: "Composition and durability runtime",
      summary:
        "Split durable truth from acceleration, and understand runtime modes and migrations.",
      file: "02b-composition-and-durability-runtime.md",
      order: 2.1,
    },
    {
      id: "getting-started",
      title: "Getting started",
      summary:
        "Create your first app quickly, provision PostgreSQL, understand generated structure, and run your first endpoint.",
    },
    {
      id: "getting-started-prereqs",
      title: "Prerequisites and local run",
      summary:
        "Provision local PostgreSQL, optional Redis, and run the initial CLI and app startup flow.",
      file: "03a-prerequisites-and-local-run.md",
      order: 3.1,
    },
    {
      id: "getting-started-structure",
      title: "Project structure walkthrough",
      summary:
        "Understand how app contracts, module folders, and durable artifacts are organized.",
      file: "03b-app-structure.md",
      order: 3.2,
    },
    {
      id: "configuration",
      title: "Configuration & environment",
      summary:
        "Learn which knobs control modules, environment loading, worker selection, and policy settings in `damat.config.ts`.",
    },
    {
      id: "configuration-sections",
      title: "Configuration sections",
      summary:
        "Map `projectConfig`, `services`, `modules`, and `providers` to ownership and responsibilities.",
      file: "04aa-configuration-sections.md",
      order: 4.01,
    },
    {
      id: "configuration-env-layers",
      title: "Environment loading and variables",
      summary:
        "Understand env precedence, required variables, and module env declarations.",
      file: "04a-configuration-environment.md",
      order: 4.2,
    },
    {
      id: "configuration-runtime-modes",
      title: "Choosing a runtime role",
      summary:
        "Choose server, worker, or combined runtime, and understand worker role behavior under restart.",
      file: "04ab-configuration-runtime-modes.md",
      order: 4.3,
    },
    {
      id: "runtime-startup",
      title: "Startup behavior and safety",
      summary:
        "Learn `runtime.mode`, worker roles, Redis fallback, and startup migration checks.",
      file: "04b-runtime-startup.md",
      order: 4.4,
    },
  ],
};
