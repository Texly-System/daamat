import { posix } from "node:path";
import { hashFile } from "../integrity";
import { assertSafeRelativePath } from "../schema/path";
import type { InstallMapping, InstallRecipe } from "../types/recipe";
import { matchGlob } from "./glob";
import { artifactRelativePath, collectArtifactFiles } from "./walk";

export interface MappedArtifactFile {
  source: string;
  relativeSource: string;
  target: string;
  checksum: string;
}

function mappedTarget(path: string, mapping: InstallMapping): string {
  const wildcard = mapping.from.search(/[?*]/);
  if (wildcard < 0) return assertSafeRelativePath(mapping.to, "mapping target");
  const prefix = mapping.from.slice(0, wildcard).replace(/[^/]*$/, "");
  const suffix = path.slice(prefix.length);
  return assertSafeRelativePath(
    posix.join(mapping.to, suffix),
    "mapping target",
  );
}

export function mapArtifactFiles(
  root: string,
  recipe: InstallRecipe,
): MappedArtifactFile[] {
  const mappings = recipe.mappings;
  return collectArtifactFiles(root, recipe)
    .map((source) => ({
      source,
      relativeSource: artifactRelativePath(root, source),
    }))
    .filter(
      ({ relativeSource }) =>
        !recipe.ignore?.some((pattern) => matchGlob(relativeSource, pattern)),
    )
    .flatMap(({ source, relativeSource }) => {
      const mapping = mappings?.find(({ from }) =>
        matchGlob(relativeSource, from),
      );
      if (mappings && !mapping) return [];
      const target = mapping
        ? mappedTarget(relativeSource, mapping)
        : relativeSource;
      return [{ source, relativeSource, target, checksum: hashFile(source) }];
    })
    .sort((left, right) => left.target.localeCompare(right.target));
}
