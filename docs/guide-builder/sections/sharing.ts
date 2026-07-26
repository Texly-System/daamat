import type { GuideSectionDefinition } from "../types";

export const sharingSection: GuideSectionDefinition = {
  id: "modules-and-sharing",
  title: "Modules & sharing",
  chapters: [
    {
      id: "authoring-modules",
      title: "Authoring a module",
      summary:
        "Design a single-purpose module with models, config, migrations, tests, and install-ready contracts.",
      file: "13-authoring-modules.md",
      order: 13,
    },
    {
      id: "module-service-and-layering",
      title: "Module service and layering",
      summary:
        "Keep service boundaries strict from route to generated accessor, and stay portable.",
      file: "13b-module-service-and-layering.md",
      order: 13.1,
    },
    {
      id: "module-testing-and-publishing",
      title: "Test and prepare a module",
      summary: "Validate module behavior, publish safely, and keep install notes accurate.",
      file: "13c-module-testing-and-publishing.md",
      order: 13.2,
    },
    {
      id: "installing-modules",
      title: "Installing existing modules",
      summary:
        "Learn module installation workflows across registry refs, local paths, and git sources.",
      file: "14-installing-modules.md",
      order: 14,
    },
    {
      id: "module-install-flow",
      title: "Plan and integrate an install",
      summary:
        "Plan install targets, run module plan/add flows, and wire host-owned capabilities manually.",
      file: "14aa-module-install-flow.md",
      order: 14.1,
    },
    {
      id: "module-package-lifecycle",
      title: "Source, package, and lifecycle",
      summary:
        "Use package mode safely, review trust metadata, and update/remove modules cleanly.",
      file: "14ab-module-package-lifecycle.md",
      order: 14.2,
    },
    {
      id: "publishing-modules",
      title: "Publish modules to a registry",
      summary:
        "Publish modules safely with verification, release metadata, and optional self-hosted registries.",
      file: "14b-publishing-modules.md",
      order: 14.3,
    },
    {
      id: "installing-modules-with-ai",
      title: "Installing modules with AI (MCP)",
      summary:
        "Use the MCP server to discover, inspect, and install modules with reduced command context.",
      file: "15-installing-modules-with-ai.md",
      order: 15,
    },
    {
      id: "module-capabilities",
      title: "Module capabilities",
      summary:
        "Understand the full capability surface: schema generation, migrations, workflows, orchestration, tests, and packaging.",
      file: "16-module-capabilities.md",
      order: 16,
    },
    {
      id: "provider-capabilities",
      title: "Durable module capabilities",
      summary:
        "Map module capability families and choose stable boundaries for jobs, events, and pipelines.",
      file: "16b-provider-capabilities.md",
      order: 16.1,
    },
    {
      id: "capabilities-installation-and-runtime",
      title: "Installation and runtime ownership",
      summary:
        "Align installer intent, transaction context, and runtime policy with host-owned behavior.",
      file: "16c-capabilities-installation-and-runtime.md",
      order: 16.2,
    },
    {
      id: "composing-and-linking-modules",
      title: "Composing & linking modules",
      summary:
        "Compose a backend from independent modules using links, `getModule`, registration, and explicit wiring.",
      file: "17-composing-and-linking-modules.md",
      order: 17,
    },
    {
      id: "link-model-design",
      title: "Design an app-owned link",
      summary:
        "Define app-owned cross-module relations with explicit link endpoints and ownership.",
      file: "17b-link-model-design.md",
      order: 17.1,
    },
    {
      id: "link-runtime-and-activation",
      title: "Activate and query links",
      summary:
        "Run migrations, query linked graph fields, and manage dormant shipped links safely.",
      file: "17c-link-runtime-and-activation.md",
      order: 17.2,
    },
  ],
};
