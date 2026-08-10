import { describe, expect, it } from "bun:test";
import { generateIdZodSchema, generateParamsZodSchema } from "../../render/zod";

describe("primary-key identity discovery", () => {
  it("supports a single custom primary-key column", () => {
    const table = {
      name: "section",
      columns: [
        {
          name: "section_id",
          type: "text" as const,
          nullable: false,
          primaryKey: true,
        },
      ],
    };
    expect(generateIdZodSchema(table)).toContain(
      "export const SectionIdSchema = z.string();",
    );
    expect(generateParamsZodSchema(table)).toContain("  id: z.string(),");
  });

  it("does not emit a scalar identity for a composite primary key", () => {
    const table = {
      name: "section_title",
      columns: [
        { name: "section_id", type: "text" as const, nullable: false },
        { name: "ordinal", type: "integer" as const, nullable: false },
      ],
      constraints: [
        {
          name: "section_title_pkey",
          type: "primary_key" as const,
          columns: ["section_id", "ordinal"],
        },
      ],
    };
    expect(generateIdZodSchema(table)).toEqual([]);
    expect(generateParamsZodSchema(table)).toEqual([]);
  });
});
