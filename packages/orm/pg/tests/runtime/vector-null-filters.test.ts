import { describe, expect, it } from "bun:test";
import { serializeVectorParams } from "../../src/executor";
import { ModelAccessor } from "../../src/query";
import { ParentModel, VectorModel } from "../helpers/vector";

describe("vector null-filter parameter alignment", () => {
  it("does not consume parameters for scalar, eq, or neq null", () => {
    for (const condition of [null, { eq: null }, { neq: null }]) {
      const descriptor = new ModelAccessor(VectorModel).findMany({
        where: { embedding: condition, compact: [1, 2], samples: [4, 5] },
      } as never);
      expect(serializeVectorParams(
        VectorModel,
        descriptor.json,
        [...descriptor.sql.params],
      )).toEqual(["[1,2]", [4, 5]]);
    }
  });

  it("keeps relation null filters aligned with later parameters", () => {
    const descriptor = new ModelAccessor(ParentModel).findMany({
      with: {
        children: {
          where: { embedding: { eq: null }, id: "child" },
          whereRaw: { sql: '"_t"."id" <> $1', params: ["excluded"] },
        },
      },
      where: { id: "parent" },
    } as never);
    expect(serializeVectorParams(
      ParentModel,
      descriptor.json,
      [...descriptor.sql.params],
    )).toEqual(["child", "excluded", "parent"]);
  });
});
