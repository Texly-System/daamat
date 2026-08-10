import { describe, expect, it, mock } from "bun:test";
import { ModelMethods } from "../../service/methods";

const baseModel = (relations: any[] = []) => ({
  _name: "parent",
  toTableSchema: () => ({ columns: [{ name: "id", primaryKey: true }], relations }),
}) as any;

function world(model: any, repos: Record<string, any>) {
  const em = {
    getRepository: mock((name: string) => repos[name] ?? repos.parent),
    getModelRegistry: () => ({ get: () => undefined, getByTableName: () => undefined }),
    transaction: async (cb: (tx: any) => Promise<any>) => cb(em),
  } as any;
  return new ModelMethods(model, "parent", em);
}

describe("service method branch guards", () => {
  it("returns zero when a cascade target has no primary key value", async () => {
    const repo = { findMany: mock(async () => [{}]), delete: mock(async () => 1) } as any;
    const methods = world(baseModel(), { parent: repo });
    expect(await methods.delete({ where: {}, cascade: true })).toBe(0);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it("rejects cascade SET DEFAULT and missing entity managers", async () => {
    const child = { findMany: mock(async () => []) } as any;
    const parent = world(
      baseModel([{ from: "children", to: "child", type: "hasMany", rule: { onDelete: "SET DEFAULT" } }]),
      { parent: { findMany: mock(async () => [{ id: 1 }]) }, child },
    );
    await expect(parent.delete({ where: {}, cascade: true })).rejects.toThrow(/SET DEFAULT/);
    const noManager = new ModelMethods(baseModel(), undefined as any, undefined as any);
    await expect(noManager.delete({ where: {}, cascade: true })).rejects.toThrow(/EntityManager/);
  });

  it("returns null for an unknown relation type and reports unregistered cascade models", async () => {
    const odd = { from: "odd", to: "odd_table", type: "unknown" };
    const repo = { findOne: mock(async () => ({ id: 1 })) } as any;
    const methods = world(baseModel([odd]), { parent: repo, odd_table: repo });
    expect(await methods.find({ include: ["odd"] })).toMatchObject({ odd: null });
    const child = { findMany: mock(async () => [{ id: "c1", parent_id: 1 }]) } as any;
    const cascading = world(
      baseModel([{ from: "children", to: "missing", type: "hasMany" }]),
      { parent: { findMany: mock(async () => [{ id: 1 }]) }, missing: child },
    );
    await expect(cascading.delete({ where: {}, cascade: true })).rejects.toThrow(/not registered/);
  });
});
