import { describe, expect, it } from "bun:test";
import type { ModuleSchema } from "@damatjs/orm-type";
import { generateZodFile } from "../../generator/generateZodFile";

describe("generateZodFile with native vectors", () => {
  it("renders vector and halfvec validators in the complete file", () => {
    const schema: ModuleSchema = {
      moduleName: "assets",
      tables: [
        {
          name: "asset",
          columns: [
            { name: "id", type: "uuid", primaryKey: true, nullable: false },
            { name: "embedding", type: "vector", dimensions: 1536, nullable: false },
            { name: "preview", type: "halfvec", dimensions: 128, nullable: true },
          ],
        },
      ],
    };
    const output = generateZodFile(schema.tables[0]!, schema, null);
    expect(output).toContain(
      "embedding: z.array(z.number().finite()).length(1536),",
    );
    expect(output).toContain(
      "preview: z.array(z.number().finite()).length(128).nullable().optional(),",
    );
  });
});
