import { describe, expect, it, mock } from "bun:test";
import { ModelMethods } from "../../service/methods";

const columns = [
  { name: "id", type: "integer", primaryKey: true, autoincrement: true, nullable: false },
  { name: "embedding", type: "vector", dimensions: 3, nullable: false },
  { name: "half", type: "halfvec", dimensions: 2, nullable: true },
  { name: "optional", type: "vector", dimensions: 1, nullable: false, default: "0" },
  { name: "flag", type: "boolean", nullable: true },
  { name: "created", type: "timestamp with time zone", nullable: true },
  { name: "label", type: "text", nullable: true },
  { name: "payload", type: "json", nullable: true },
] as any;

function makeRepo() {
  return {
    create: mock(async (o: any) => o.data),
    createMany: mock(async (o: any) => o.data),
    upsert: mock(async (o: any) => o.data),
    upsertMany: mock(async (o: any) => o.data),
    update: mock(async (o: any) => [o.set]),
    updateOne: mock(async (set: any) => set),
  } as any;
}

function makeMethods(repo = makeRepo()) {
  const model = { _name: "asset", toTableSchema: () => ({ columns, relations: [] }) } as any;
  const em = { getRepository: mock(() => repo) } as any;
  return { methods: new ModelMethods(model, "asset", em), repo };
}

const valid = { embedding: [1, 2, 3], half: [0, -1], optional: [0] };

describe("service native vector validation", () => {
  it("validates every write entrypoint before repository calls", async () => {
    const { methods, repo } = makeMethods();
    await methods.create({ data: valid });
    await methods.createMany({ data: [valid] });
    await methods.upsert({ data: valid, onConflict: ["id"] });
    await methods.upsertMany({ data: [valid], onConflict: ["id"] });
    await methods.update({ where: { id: 1 }, data: { embedding: [3, 2, 1] } });
    await methods.updateOne({ where: { id: 1 }, data: { embedding: [3, 2, 1] } });
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.createMany).toHaveBeenCalledTimes(1);
    expect(repo.upsert).toHaveBeenCalledTimes(1);
    expect(repo.upsertMany).toHaveBeenCalledTimes(1);
    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(repo.updateOne).toHaveBeenCalledTimes(1);
  });

  it("accepts nullable and optional vector values when omitted or null", async () => {
    const { methods } = makeMethods();
    await methods.create({ data: { embedding: [1, 2, 3], half: null } });
    await methods.update({ where: { id: 1 }, data: { half: null } });
  });

  it("reports short, long, nonarray, nonnumeric, and non-finite values", async () => {
    const cases: unknown[] = [[1, 2], [1, 2, 3, 4], "1,2,3", [1, "2", 3], [1, 2, NaN], [1, 2, Infinity], [1, 2, -Infinity]];
    for (const value of cases) {
      const { methods, repo } = makeMethods();
      await expect(methods.create({ data: { embedding: value } as any })).rejects.toThrow(
        /embedding|exactly|array|number|finite/,
      );
      expect(repo.create).not.toHaveBeenCalled();
    }
  });

  it("rejects invalid bulk rows before issuing SQL", async () => {
    const { methods, repo } = makeMethods();
    await expect(
      methods.createMany({ data: [valid, { embedding: [1] }] as any }),
    ).rejects.toThrow(/exactly 3/);
    await expect(
      methods.upsertMany({ data: [{ embedding: [1, 2, 3] }, { embedding: [1, 2] }] as any, onConflict: ["id"] }),
    ).rejects.toThrow(/exactly 3/);
    expect(repo.createMany).not.toHaveBeenCalled();
    expect(repo.upsertMany).not.toHaveBeenCalled();
  });
});
