import boxen from "boxen";
import pc from "picocolors";
import { emojify } from "node-emoji";
import type { Spinner } from "yocto-spinner";
import ProcessManager from "./manager";

export type FactBoxOptions = {
  interval: NodeJS.Timeout | null;
  spinner: Spinner;
  processManager: ProcessManager;
  message?: string;
  title?: string;
  verbose?: boolean;
};

const facts = [
  "damat was architected with composability at its core, allowing teams to scale features independently.",
  "The system encourages a plug-and-play philosophy where entire domains can be swapped without affecting others.",
  "damat draws architectural inspiration from damat.js but introduces stronger AI-assisted scaffolding patterns.",
  "AI can be used alongside damat to auto-generate modules, workflows, and data models.",
  "The backend is designed to support both B2C and B2B commerce out of the box.",
  "damat promotes strict separation between orchestration logic and domain logic.",
  "The platform supports event sourcing patterns for extensible commerce flows.",
  "damat is built to handle high SKU counts and complex catalog structures efficiently.",
  "It supports advanced pricing strategies such as tiered, rule-based, and context-aware pricing.",
  "The architecture is optimized for serverless and edge deployments.",
  "damat encourages infrastructure abstraction so storage, caching, and queues can be swapped easily.",
  "Developers can inject custom services into core workflows without modifying the engine.",
  "The platform supports multi-tenant commerce setups from a single backend instance.",
  "damat is designed to integrate cleanly with AI-driven personalization engines.",
  "Background jobs can be processed using pluggable queue providers.",
  "The system enables dynamic feature toggling at the module level.",
  "damat supports marketplace-style commerce with multiple vendors under one storefront.",
  "It allows custom business rules to be enforced at the workflow layer.",
  "The architecture favors explicit data contracts over implicit coupling.",
  "damat can serve multiple frontend clients simultaneously, including web, mobile, and POS systems.",
  "Security boundaries are enforced through scoped tokens and layered API access.",
  "The platform supports audit logging for critical commerce operations.",
  "damat enables complex fulfillment logic including split shipments and multi-warehouse routing.",
  "The system is designed to evolve without requiring breaking schema migrations in most cases.",
  "damat encourages automated testing by keeping domain services pure and isolated.",
  "Commerce logic can be extended without forking the core codebase.",
  "The backend is built to integrate seamlessly with third-party ERP and CRM systems.",
  "damat promotes performance optimization through selective data loading and caching strategies.",
  "It is designed to support future AI-native commerce experiences such as autonomous pricing and demand forecasting.",
];

export const getFact = () => {
  const randIndex = Math.floor(Math.random() * facts.length);

  return facts[randIndex];
};

export const showFact = ({
  spinner,
  title,
  verbose = false,
}: Pick<FactBoxOptions, "spinner" | "verbose"> & {
  title: string;
}) => {
  const fact = getFact();
  if (verbose) {
    spinner.stop();
    console.log(pc.cyan("\u28fb"), title);
    spinner.start(title);
  } else {
    spinner.text =
      `${title}\n${boxen(`${fact}`, {
        title: pc.cyan(`${emojify(":bulb:")} damat Tips`),
        titleAlignment: "center",
        textAlignment: "center",
        padding: 1,
        margin: 1,
      })}`;
  }
};

export const createFactBox = ({
  spinner,
  title,
  processManager,
  verbose = false,
}: Pick<FactBoxOptions, "spinner" | "processManager" | "verbose"> & {
  title: string;
}): NodeJS.Timeout => {
  showFact({ spinner, title, verbose });
  const interval = setInterval(() => {
    showFact({ spinner, title, verbose });
  }, 10000);

  processManager.addInterval(interval);

  return interval;
};

export const resetFactBox = ({
  interval,
  spinner,
  successMessage,
  processManager,
  newTitle,
  verbose = false,
}: Pick<
  FactBoxOptions,
  "interval" | "spinner" | "processManager" | "verbose"
> & {
  successMessage: string;
  newTitle?: string;
}): NodeJS.Timeout | null => {
  if (interval) {
    clearInterval(interval);
  }

  spinner.success(pc.green(successMessage));
  spinner.start();
  let newInterval = null;
  if (newTitle) {
    newInterval = createFactBox({
      spinner,
      title: newTitle,
      processManager,
      verbose,
    });
  }

  return newInterval;
};

export function displayFactBox({
  interval,
  spinner,
  processManager,
  title = "",
  message = "",
  verbose = false,
}: FactBoxOptions): NodeJS.Timeout | null {
  if (!message) {
    return createFactBox({ spinner, title, processManager, verbose });
  }

  return resetFactBox({
    interval,
    spinner,
    successMessage: message,
    processManager,
    newTitle: title,
    verbose,
  });
}
