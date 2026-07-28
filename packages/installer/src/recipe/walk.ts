import { lstatSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";
import type { InstallMapping, InstallRecipe } from "../types/recipe";
import { matchGlob } from "./glob";

const EXCLUDED_DIRECTORIES = new Set([".git", "node_modules"]);

export function artifactRelativePath(root: string, path: string): string {
  return lstatSync(root).isDirectory()
    ? relative(root, path).split("\\").join("/")
    : basename(path);
}

function ignored(path: string, recipe: InstallRecipe): boolean {
  return Boolean(recipe.ignore?.some((pattern) => matchGlob(path, pattern)));
}

function selected(path: string, recipe: InstallRecipe): boolean {
  if (ignored(path, recipe)) return false;
  return !recipe.mappings?.length ||
    recipe.mappings.some(({ from }) => matchGlob(path, from));
}

function ignoredSubtree(path: string, recipe: InstallRecipe): boolean {
  return Boolean(
    recipe.ignore?.some(
      (pattern) =>
        matchGlob(path, pattern) ||
        (pattern.endsWith("/**") && matchGlob(path, pattern.slice(0, -3))),
    ),
  );
}

function fixedDirectory(pattern: string): string {
  const wildcard = pattern.search(/[?*]/);
  const head = wildcard < 0 ? pattern : pattern.slice(0, wildcard);
  if (head.endsWith("/")) return head.slice(0, -1);
  const separator = head.lastIndexOf("/");
  return separator < 0 ? "" : head.slice(0, separator);
}

function couldContain(path: string, mapping: InstallMapping): boolean {
  if (!/[?*]/.test(mapping.from)) return mapping.from.startsWith(`${path}/`);
  const fixed = fixedDirectory(mapping.from);
  return (
    !fixed ||
    fixed === path ||
    fixed.startsWith(`${path}/`) ||
    path.startsWith(`${fixed}/`)
  );
}

function walk(root: string, path: string, recipe: InstallRecipe): string[] {
  const stat = lstatSync(path);
  const relativePath = path === root ? "" : artifactRelativePath(root, path);
  if (stat.isSymbolicLink()) {
    if (!relativePath || selected(relativePath, recipe))
      throw new Error(`symbolic link is not installable: ${path}`);
    return [];
  }
  if (!stat.isDirectory()) return [path];
  if (
    relativePath &&
    (ignoredSubtree(relativePath, recipe) ||
      (recipe.mappings?.length &&
        !recipe.mappings.some((mapping) => couldContain(relativePath, mapping))))
  )
    return [];
  return readdirSync(path)
    .sort()
    .filter((name) => !EXCLUDED_DIRECTORIES.has(name))
    .flatMap((name) => walk(root, join(path, name), recipe));
}

export function collectArtifactFiles(
  root: string,
  recipe: InstallRecipe,
): string[] {
  return walk(root, root, recipe);
}
