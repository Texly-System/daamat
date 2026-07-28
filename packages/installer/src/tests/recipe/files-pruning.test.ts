import { expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mapArtifactFiles, type InstallRecipe } from "../../index";

const recipe: InstallRecipe = {
  schemaVersion: 1,
  id: "blade",
  kind: "module",
  mappings: [{ from: "src/**", to: "target" }],
};

function artifact(name: string): string {
  const root = mkdtempSync(join(tmpdir(), `installer-${name}-`));
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "src/index.ts"), "export {};");
  return root;
}

function sources(root: string, input: InstallRecipe = recipe): string[] {
  return mapArtifactFiles(root, input).map((item) => item.relativeSource);
}

test("skips Bun executable links in node_modules", () => {
  const root = artifact("bun-bin");
  mkdirSync(join(root, "node_modules/.bin"), { recursive: true });
  symlinkSync(join(root, "src/index.ts"), join(root, "node_modules/.bin/damat"));
  expect(sources(root)).toEqual(["src/index.ts"]);
});

test("does not traverse a recipe-ignored subtree", () => {
  const root = artifact("ignored");
  mkdirSync(join(root, "ignored"));
  symlinkSync(join(root, "src/index.ts"), join(root, "ignored/link"));
  symlinkSync(join(root, "src/index.ts"), join(root, "ignored-link"));
  expect(
    sources(root, { ...recipe, ignore: ["ignored/**", "ignored-link"] }),
  ).toEqual(["src/index.ts"]);
});

test("does not traverse an unmapped subtree or external directory link", () => {
  const root = artifact("unmapped");
  const outside = artifact("outside");
  mkdirSync(join(root, "docs"));
  symlinkSync(join(root, "src/index.ts"), join(root, "docs/link"));
  symlinkSync(outside, join(root, "external"), "dir");
  expect(sources(root)).toEqual(["src/index.ts"]);
});

test("rejects selected file and directory symlinks without following them", () => {
  const fileRoot = artifact("mapped-file");
  symlinkSync(join(fileRoot, "src/index.ts"), join(fileRoot, "src/link"));
  expect(() => sources(fileRoot)).toThrow("symbolic link is not installable");
  const directoryRoot = artifact("mapped-directory");
  const outside = artifact("mapped-outside");
  symlinkSync(outside, join(directoryRoot, "src/external"), "dir");
  expect(() => sources(directoryRoot)).toThrow(
    "symbolic link is not installable",
  );
});
