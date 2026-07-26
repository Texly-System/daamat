import fs from "node:fs";
import path from "node:path";
import { type RenderResult, renderMarkdown } from "./markdown";
import { DOCS_DIR, REPO_ROOT } from "./repo";
import type { NavSection, SearchDoc } from "./types";

export interface Chapter {
  id: string;
  order: number;
  title: string;
  slug: string;
  /** Repo-relative source path, e.g. `docs/guide/01-introduction.md`. */
  path: string;
  summary: string;
  section: string;
}

export interface Section {
  id: string;
  title: string;
  chapters: Chapter[];
}

interface PackageDocMeta {
  packageName: string;
  packageGroup: string;
  sourcePath: string;
  title: string;
  summary: string;
  slug: string;
}

interface PackageDocLink {
  sourcePath: string;
  slug: string;
  title: string;
  summary: string;
}

interface PackageCatalogPackage {
  name: string;
  dir: string;
  description: string;
  docs: PackageDocLink[];
}

export interface PackageCatalog {
  group: string;
  packages: PackageCatalogPackage[];
}

interface GuideSection {
  id: string;
  title: string;
  chapters: Array<{
    id: string;
    order: number;
    title: string;
    slug: string;
    path: string;
    summary: string;
  }>;
}

interface GuidePackageEntry {
  name: string;
  description?: string;
  dir: string;
  readme: string;
  docsIndex: string | null;
  docs: string[];
}

interface GuidePackageGroup {
  group: string;
  packages: GuidePackageEntry[];
}

interface GuideTopLevelDoc {
  id: string;
  title: string;
  path: string;
  summary: string;
}

interface GuideJson {
  topLevel: GuideTopLevelDoc[];
  guide: GuideSection[];
  packages: GuidePackageGroup[];
}

const GUIDE_PATH = path.join(DOCS_DIR, "guide.json");

interface CachedGuide {
  generatedAtMs: number;
  sections: Section[];
  packageDocs: PackageDocMeta[];
  packageCatalog: PackageCatalog[];
  packageLookup: Map<string, PackageDocMeta>;
}

function loadGuide(): GuideJson {
  const raw = fs.readFileSync(GUIDE_PATH, "utf8");
  return JSON.parse(raw) as GuideJson;
}

function toPosix(sourcePath: string) {
  return sourcePath.replace(/\\/g, "/");
}

function normalizeSourcePath(candidate: string): string | null {
  const normalized = path.posix
    .normalize(toPosix(candidate))
    .replace(/^\.\/+/, "");
  if (normalized.startsWith("../") || path.posix.isAbsolute(normalized)) return null;
  if (path.posix.relative("/", `/${normalized}`).startsWith("..")) {
    return null;
  }
  if (!normalized.endsWith(".md")) return null;
  return normalized;
}

function isPackageDocPath(candidate: string) {
  const normalized = normalizeSourcePath(candidate);
  return Boolean(
    normalized && normalized.startsWith("packages/") && !normalized.includes("../"),
  );
}

function parseGuideSections(guide: GuideJson): Section[] {
  return guide.guide.map((section) => ({
    id: section.id,
    title: section.title,
    chapters: section.chapters
      .map((c) => ({ ...c, section: section.title }))
      .sort((a, b) => a.order - b.order),
  }));
}

function firstHeading(raw: string, sourcePath: string) {
  const match = raw.match(/^#\s+(.+)$/m);
  if (match) return match[1]!.trim();
  const base = path.posix.basename(toPosix(sourcePath), ".md");
  return base
    .replace(/^\d+-/, "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((token) => token[0]!.toUpperCase() + token.slice(1))
    .join(" ");
}

function extractSummary(raw: string): string {
  const stripped = cleanMarkdown(raw);
  const text = toPlainText(stripped);
  return text.slice(0, 240).trim() || "Package documentation";
}

function collectPackageDocs(guide: GuideJson): PackageDocMeta[] {
  const docs: PackageDocMeta[] = [];
  const seen = new Set<string>();

  for (const group of guide.packages) {
    for (const pkg of group.packages) {
      for (const sourcePath of pkg.docs) {
        const normalized = normalizeSourcePath(sourcePath);
        if (!normalized || !isPackageDocPath(normalized) || seen.has(normalized)) {
          continue;
        }

        const absolute = path.join(REPO_ROOT, normalized);
        if (!fs.existsSync(absolute)) continue;

        const raw = fs.readFileSync(absolute, "utf8");
        docs.push({
          packageName: pkg.name,
          packageGroup: group.group,
          sourcePath: normalized,
          title: firstHeading(raw, normalized),
          summary: extractSummary(raw),
          slug: `package/${normalized}`,
        });
        seen.add(normalized);
      }
    }
  }

  return docs;
}

function buildPackageCatalog(
  guide: GuideJson,
  packageDocs: PackageDocMeta[],
): PackageCatalog[] {
  const byPath = new Map(packageDocs.map((doc) => [doc.sourcePath, doc] as const));

  return guide.packages.map((group) => ({
    group: group.group,
    packages: group.packages.map((pkg) => ({
      name: pkg.name,
      dir: pkg.dir,
      description: pkg.description ?? "",
      docs: pkg.docs
        .map((candidate) => {
          const sourcePath = normalizeSourcePath(candidate);
          if (!sourcePath) return null;
          const doc = byPath.get(sourcePath);
          if (!doc) return null;
          return {
            sourcePath,
            slug: doc.slug,
            title: doc.title,
            summary: doc.summary,
          };
        })
        .filter((doc): doc is PackageDocLink => Boolean(doc)),
    })),
  }));
}

let cachedGuide: CachedGuide | null = null;

function getGuideCache(): CachedGuide {
  const generatedAtMs = fs.statSync(GUIDE_PATH).mtimeMs;
  if (!cachedGuide || cachedGuide.generatedAtMs !== generatedAtMs) {
    const guide = loadGuide();
    const sections = parseGuideSections(guide);
    const packageDocs = collectPackageDocs(guide);
    const packageCatalog = buildPackageCatalog(guide, packageDocs);
    cachedGuide = {
      generatedAtMs,
      sections,
      packageDocs,
      packageCatalog,
      packageLookup: new Map(packageDocs.map((doc) => [doc.sourcePath, doc])),
    };
  }

  return cachedGuide;
}

export function getSections(): Section[] {
  return getGuideCache().sections;
}

/** Client-safe navigation tree (no source paths) for the sidebar/header. */
export function getNav(): NavSection[] {
  return getSections().map((section) => ({
    id: section.id,
    title: section.title,
    chapters: section.chapters.map((c) => ({
      slug: c.slug,
      title: c.title,
      summary: c.summary,
    })),
  }));
}

export function getChapters(): Chapter[] {
  return getSections()
    .flatMap((s) => s.chapters)
    .sort((a, b) => a.order - b.order);
}

export function getChapter(slug: string): Chapter | undefined {
  return getChapters().find((c) => c.slug === slug);
}

/** Basename → in-site route, used to rewrite relative `.md` links. */
function buildSlugMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of getChapters()) {
    map[path.basename(c.path)] = `/docs/${c.slug}`;
  }
  return map;
}

/** Strip the markdown breadcrumb header and prev/next footer — we render our own. */
function cleanMarkdown(raw: string): string {
  let lines = raw.replace(/\r\n/g, "\n").split("\n");

  // Leading breadcrumb line (e.g. "[Damat Guide](../GUIDE.md) › Introduction").
  let i = 0;
  while ((lines[i] ?? "x").trim() === "") i++;
  const breadcrumb = lines[i];
  if (breadcrumb && /›/.test(breadcrumb) && /\]\(/.test(breadcrumb)) {
    lines = lines.slice(i + 1);
  }

  // Trailing nav line ("[Guide home] · Next: [...]") plus its `---` separator.
  while ((lines.at(-1) ?? "x").trim() === "") lines.pop();
  const last = lines.at(-1) ?? "";
  if (
    /\]\(/.test(last) &&
    /(Guide home|Guide index|Next:|Prev:|Package reference|←|→)/.test(last)
  ) {
    lines.pop();
    while ((lines.at(-1) ?? "x").trim() === "") lines.pop();
    if ((lines.at(-1) ?? "").trim() === "---") lines.pop();
  }

  return lines.join("\n").trim();
}

export interface Doc extends RenderResult {
  chapter: Chapter;
  prev?: Chapter;
  next?: Chapter;
}

export async function getDoc(slug: string): Promise<Doc | null> {
  const chapter = getChapter(slug);
  if (!chapter) return null;

  const raw = fs.readFileSync(path.join(REPO_ROOT, chapter.path), "utf8");
  const cleaned = cleanMarkdown(raw);
  const rendered = await renderMarkdown(cleaned, {
    sourcePath: chapter.path,
    slugMap: buildSlugMap(),
  });

  const chapters = getChapters();
  const idx = chapters.findIndex((c) => c.slug === slug);

  return {
    ...rendered,
    chapter,
    prev: idx > 0 ? chapters[idx - 1] : undefined,
    next: idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : undefined,
  };
}

export interface PackageDocPage extends RenderResult {
  sourcePath: string;
  slug: string;
  title: string;
  summary: string;
  packageName: string;
  packageGroup: string;
}

export function getPackageCatalog(): PackageCatalog[] {
  return getGuideCache().packageCatalog;
}

export function getPackageDocs(): PackageDocMeta[] {
  return getGuideCache().packageDocs;
}

export function getAllPackageRouteSlugs(): string[] {
  return getPackageDocs().map((doc) => doc.slug);
}

function resolvePackageSourcePath(
  input: string | readonly string[],
): string | null {
  const sourcePath =
    Array.isArray(input) ? path.posix.join(...input) : input.toString();
  const normalized = normalizeSourcePath(sourcePath);
  if (!normalized) return null;
  return normalized;
}

export async function getPackageDoc(
  sourcePath: string | readonly string[],
): Promise<PackageDocPage | null> {
  const normalized = resolvePackageSourcePath(sourcePath);
  if (!normalized) return null;

  const doc = getGuideCache().packageLookup.get(normalized);
  if (!doc) return null;

  const absolute = path.join(REPO_ROOT, normalized);
  const raw = fs.readFileSync(absolute, "utf8");
  const cleaned = cleanMarkdown(raw);
  const rendered = await renderMarkdown(cleaned, {
    sourcePath: normalized,
    slugMap: buildSlugMap(),
  });

  return {
    ...rendered,
    sourcePath: normalized,
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    packageName: doc.packageName,
    packageGroup: doc.packageGroup,
  };
}

export type { SearchDoc };

function toPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[#>|]+/gm, " ")
    .replace(/[*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compact, client-shippable search index built from guide + package docs. */
export function getSearchIndex(): SearchDoc[] {
  const chapterIndex = getChapters().map((c) => {
    const raw = fs.readFileSync(path.join(REPO_ROOT, c.path), "utf8");
    const cleaned = cleanMarkdown(raw);
    const headings = Array.from(cleaned.matchAll(/^#{2,3}\s+(.+)$/gm)).map(
      (m) => (m[1] ?? "").replace(/[#`*_]/g, "").trim(),
    );
    return {
      slug: c.slug,
      title: c.title,
      section: c.section,
      summary: c.summary,
      headings,
      text: toPlainText(cleaned).slice(0, 1800),
    };
  });

  const packageIndex = getPackageDocs().map((pkg) => {
    const raw = fs.readFileSync(path.join(REPO_ROOT, pkg.sourcePath), "utf8");
    const cleaned = cleanMarkdown(raw);
    const headings = Array.from(cleaned.matchAll(/^#{2,3}\s+(.+)$/gm)).map(
      (m) => (m[1] ?? "").replace(/[#`*_]/g, "").trim(),
    );
    return {
      slug: pkg.slug,
      title: pkg.title,
      section: `${pkg.packageGroup} · ${pkg.packageName}`,
      summary: pkg.summary,
      headings,
      text: toPlainText(cleaned).slice(0, 1800),
    };
  });

  return [...chapterIndex, ...packageIndex];
}

/** All slugs for chapter pages (`/docs/[slug]`, no package routes). */
export function getAllSlugs(): string[] {
  return getChapters().map((c) => c.slug);
}

/** All slugs for docs-site routes (`/docs/...`). */
export function getAllRouteSlugs(): string[] {
  return [...getAllSlugs(), ...getAllPackageRouteSlugs()];
}
