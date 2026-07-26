import { reportError, type CommandContext } from "@damatjs/cli";
import type { DamatManifest, InstallerPlan } from "@damatjs/installer";
import { moduleInstructions } from "../profile";

export function reportModuleError(
  ctx: CommandContext,
  error: unknown,
  prefix: string,
): void {
  reportError(ctx.logger, error, {
    prefix,
    verbose: Boolean(ctx.options.verbose),
  });
}

export function reportModulePlan(
  ctx: CommandContext,
  plan: InstallerPlan,
  provider?: DamatManifest,
): void {
  ctx.logger.info(`${plan.action} module "${plan.installationId}"`, {
    mode: plan.mode,
    ...(plan.packageBackend && { packageBackend: plan.packageBackend }),
    operations: plan.operations.length,
  });
  for (const mapping of plan.capabilityMappings ?? []) {
    ctx.logger.info(`capability ${mapping.capability}`, {
      providerSource: mapping.providerSource,
      destination: mapping.destination,
      destinationSource: mapping.destinationSource,
      operations: mapping.operationCount,
    });
  }
  plan.warnings.forEach((warning) => ctx.logger.warn(warning));
  const defaults = moduleInstructions(plan.installationId);
  const instructions =
    plan.action === "remove"
      ? (provider?.install?.instructions?.remove ?? defaults.remove)
      : (provider?.install?.instructions?.add ?? defaults.add);
  instructions.forEach((instruction) => ctx.logger.info(instruction));
}
