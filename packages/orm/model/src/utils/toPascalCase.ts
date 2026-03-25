
// ─── Helper ───────────────────────────────────────────────────────────────────

/** Convert snake_case / kebab-case / spaced table name to PascalCase */
export const toPascalCase = (str: string): string => {
  return str
    .split(/[_\-\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}