import { describe, expect, it, mock } from "bun:test";
import { ModelMethods } from "../../service/methods";

const embedding = {
  name: "embedding",
  type: "halfvec",
  dimensions: 2048,
  nullable: false,
};

function makeMethods() {
  const repo = { create: mock(async (options: any) => options.data) } as any;
  const model = {
    _name: "asset",
    toTableSchema: () => ({ columns: [embedding], relations: [] }),
  } as any;
  const em = { getRepository: mock(() => repo) } as any;
  return { methods: new ModelMethods(model, "asset", em), repo };
}

describe("Asset-like halfvec(2048) validation", () => {
  it("accepts exactly 2048 finite values", async () => {
    const { methods, repo } = makeMethods();
    await methods.create({ data: { embedding: Array.from({ length: 2048 }, () => 0.25) } });
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it("rejects wrong dimensions and all non-finite values before SQL", async () => {
    const values = [
      Array.from({ length: 2047 }, () => 0),
      Array.from({ length: 2049 }, () => 0),
      [...Array.from({ length: 2047 }, () => 0), Number.NaN],
      [...Array.from({ length: 2047 }, () => 0), Number.POSITIVE_INFINITY],
      [...Array.from({ length: 2047 }, () => 0), Number.NEGATIVE_INFINITY],
    ];
    for (const value of values) {
      const { methods, repo } = makeMethods();
      await expect(methods.create({ data: { embedding: value } })).rejects.toThrow(
        /embedding|exactly|finite/,
      );
      expect(repo.create).not.toHaveBeenCalled();
    }
  });
});
