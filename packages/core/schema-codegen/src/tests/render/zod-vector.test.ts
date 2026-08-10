import { describe, expect, it } from "bun:test";
import type { ModuleSchema } from "@damatjs/orm-type";
import { generateNewZodSchema, generateQueryZodSchema } from "../../render/zod";

const table: ModuleSchema["tables"][number] = {
  name: "asset",
  columns: [
    { name: "embedding", type: "vector", dimensions: 3, nullable: false },
    { name: "compact", type: "halfvec", dimensions: 2, nullable: true },
  ],
};

describe("native vector Zod renderers", () => {
  it("uses the exact finite and dimension validator for new inputs", () => {
    const body = generateNewZodSchema(table, new Set(), []).join("\n");
    expect(body).toContain(
      "embedding: z.array(z.number().finite()).length(3),",
    );
    expect(body).toContain(
      "compact: z.array(z.number().finite()).length(2).nullable().optional(),",
    );
  });

  it("keeps vector validators optional in query schemas", () => {
    const body = generateQueryZodSchema(table, []).join("\n");
    expect(body).toContain(
      "embedding: z.array(z.number().finite()).length(3).optional(),",
    );
    expect(body).toContain(
      "compact: z.array(z.number().finite()).length(2).nullable().optional(),",
    );
  });
});
