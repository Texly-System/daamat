import type { RelationOptions } from "@damatjs/orm-type";
import type { ModelTarget } from "@/utils";
import { BelongsTo, belongsTo } from "./relation/belongsToBuilder";
import { HasMany, hasMany } from "./relation/hasManyBuilder";
import { HasOne, hasOne } from "./relation/hasOneBuilder";
import { ConstraintBuilder } from "./constraints";
import { IndexBuilder } from "./indexes";

export const relationFactories = {
  belongsTo: (target: ModelTarget, options?: RelationOptions): BelongsTo =>
    belongsTo(target, options),
  hasMany: (target: ModelTarget, options?: RelationOptions): HasMany =>
    hasMany(target, options),
  hasOne: (target: ModelTarget, options?: RelationOptions): HasOne =>
    hasOne(target, options),
  indexes: (name?: string): IndexBuilder => new IndexBuilder(name),
  constrains: (name?: string): ConstraintBuilder => new ConstraintBuilder(name),
};
