import { createHash } from "node:crypto";
import fs from "node:fs";

const NON_TRANSACTIONAL = [
  /\bCREATE\s+INDEX\s+CONCURRENTLY\b/i,
  /\bDROP\s+INDEX\s+CONCURRENTLY\b/i,
  /\bREINDEX\b[\s\S]*?\bCONCURRENTLY\b/i,
  /\bALTER\s+TYPE\b[\s\S]*?\bADD\s+VALUE\b/i,
];

export function migrationChecksum(source: string | Uint8Array): string {
  return createHash("sha256").update(source).digest("hex");
}

export function migrationFileChecksum(path: string): string {
  return migrationChecksum(fs.readFileSync(path));
}

export function nonTransactionalConstruct(sql: string): string | undefined {
  for (const expression of NON_TRANSACTIONAL) {
    const match = expression.exec(sql);
    if (match) return match[0].replace(/\s+/g, " ");
  }
  return undefined;
}
