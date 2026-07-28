import type { InstallRecipe } from "../types";
import { matchProfiles } from "./match";
import type { MatchProfilesInput } from "./types";

function specificity(pattern: string): [number, number] {
  const wildcard = pattern.search(/[?*]/);
  const fixed = wildcard < 0 ? pattern.length + 1 : wildcard;
  return [fixed, pattern.replace(/[?*]/g, "").length];
}

function specificFirst(left: { from: string }, right: { from: string }): number {
  const leftRank = specificity(left.from);
  const rightRank = specificity(right.from);
  return (
    rightRank[0] - leftRank[0] ||
    rightRank[1] - leftRank[1] ||
    left.from.localeCompare(right.from)
  );
}

export function createProfileRecipe(input: MatchProfilesInput): InstallRecipe {
  const { provider } = input;
  const profile = provider.install;
  const capabilityMappings = matchProfiles(input);
  const mappings = capabilityMappings
    .map(({ from, to }) => ({ from, to }))
    .sort(specificFirst);
  const install = profile?.modes
    ? {
        modes: profile.modes,
        ...(profile.default && { default: profile.default }),
      }
    : undefined;
  return {
    schemaVersion: 1,
    id: provider.name,
    kind: provider.kind,
    ...(provider.version && { version: provider.version }),
    ...(install && { install }),
    ...(mappings.length > 0 && { mappings }),
    ...(profile?.ignore && { ignore: profile.ignore }),
    ...(profile?.packages && { packages: profile.packages }),
    ...(profile?.usageHints && { usageHints: profile.usageHints }),
    capabilityMappings,
  };
}
