import type { ModelDefinition, ModelProperties } from "@/types/schema";
import type { RelationType } from "@/types/relation";

/**
 * Minimal interface for what relations need from a model
 */
export interface ModelLike {
  _tableName: string;
}

/**
 * Target can be a model directly or a lazy function (for circular refs)
 *
 * Direct: belongsTo(UserSchema)
 * Lazy:   belongsTo(() => UserSchema)  // for circular references
 */
export type Target<T extends ModelLike> = T | (() => T);

/**
 * Resolve target to its value
 */
function resolve<T extends ModelLike>(target: Target<T>): T {
  return typeof target === "function" ? (target as () => T)() : target;
}

/**
 * Base class for all relations
 *
 * Relations receive the target MODEL directly:
 * - Access to _tableName for FK generation
 * - Access to _properties for type inference
 * - Clean API: belongsTo(UserSchema)
 *
 * For circular references, wrap in a function: belongsTo(() => UserSchema)
 */
export abstract class Relation<TModel extends ModelLike = ModelLike> {
  readonly kind: RelationType;

  /** The target model (or lazy function for circular refs) */
  protected target: Target<TModel>;

  /** Inverse property name on target model */
  protected _inverse?: string;

  /** Property name this relation is assigned to (set during schema build) */
  protected _propertyName?: string;

  constructor(kind: RelationType, target: Target<TModel>) {
    this.kind = kind;
    this.target = target;
  }

  /** Get the target model (resolves lazy reference if needed) */
  getTarget(): TModel {
    return resolve(this.target);
  }

  /** Get the target table name */
  getTargetTable(): string {
    return this.getTarget()._tableName;
  }

  /** Get inverse property name */
  getInverse(): string | undefined {
    return this._inverse;
  }

  /** Set property name (called during schema conversion) */
  _setPropertyName(name: string): void {
    this._propertyName = name;
  }

  /** Get property name */
  getPropertyName(): string | undefined {
    return this._propertyName;
  }

  /** Whether this relation creates a FK on this table */
  abstract createsForeignKey(): boolean;
}

/**
 * Extract model properties type from a relation
 */
export type InferTargetProperties<R> =
  R extends Relation<infer M>
  ? M extends ModelDefinition<infer P>
  ? P
  : ModelProperties
  : never;
