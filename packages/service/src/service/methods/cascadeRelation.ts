import type { ModelDefinition } from "@damatjs/orm-model";
import type { RelationSchema } from "@damatjs/orm-type";
import { getRelatedRepository } from "./state";
import { childFkColumn } from "./cascadeSupport";
import { resolveModel } from "./readRelations";

export type CascadeNext = (
  model: ModelDefinition,
  name: string,
  rows: Record<string, any>[],
  mode: "hard" | "soft",
  visited: Set<string>,
) => Promise<{ count: number; rows: Record<string, any>[] }>;

export async function cascadeRelation(
  methods: unknown,
  parentModel: ModelDefinition,
  parentName: string,
  relation: RelationSchema,
  targetIds: unknown[],
  mode: "hard" | "soft",
  visited: Set<string>,
  next: CascadeNext,
): Promise<number> {
  const childTable = relation.to;
  const fkColumn = childFkColumn(relation, parentModel);
  const childRepo = getRelatedRepository(methods, childTable);
  const rule = relation.rule?.onDelete;
  if (rule === "SET NULL") {
    await childRepo.update({
      set: { [fkColumn]: null },
      where: { [fkColumn]: { in: targetIds } },
    } as any);
    return 0;
  }
  if (rule === "RESTRICT" || rule === "NO ACTION") {
    const blocking = await childRepo.count({ [fkColumn]: { in: targetIds } } as any);
    if (blocking > 0) {
      throw new Error(
        `Cannot delete from "${parentName}": ${blocking} related "${childTable}" row(s) exist (onDelete: ${rule}).`,
      );
    }
    return 0;
  }
  if (rule === "SET DEFAULT") {
    throw new Error(
      `onDelete rule "SET DEFAULT" is not supported by cascade delete (relation ${parentName}.${relation.from}).`,
    );
  }
  const childRows = (await childRepo.findMany({
    where: { [fkColumn]: { in: targetIds } },
  } as any)) as Record<string, any>[];
  if (childRows.length === 0) return 0;
  const childModel = resolveModel(methods, childTable);
  const sub = await next(childModel, childTable, childRows, mode, visited);
  return sub.count;
}
