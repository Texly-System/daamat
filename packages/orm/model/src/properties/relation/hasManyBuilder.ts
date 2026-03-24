import type { HasManyConfig } from "@/types/relation";
import { Relation, ModelLike, Target } from "./base";

/**
 * HasMany - Inverse side of a one-to-many relationship
 *
 * Does NOT create any DB artifacts. This is metadata for the ORM.
 * The FK lives on the "many" side (the model with belongsTo).
 *
 * Usage:
 * ```ts
 * const UserSchema = model('users', {
 *   // User has many posts (FK is on posts table)
 *   posts: hasMany(PostSchema, { inverse: 'author' })
 * })
 * ```
 */
export class HasMany<
  TModel extends ModelLike = ModelLike,
> extends Relation<TModel> {
  constructor(target: Target<TModel>, config?: HasManyConfig) {
    super("hasMany", target);

    if (config?.inverse) {
      this._inverse = config.inverse;
    }
  }

  /** Set inverse property name */
  inverse(propertyName: string): this {
    this._inverse = propertyName;
    return this;
  }

  createsForeignKey(): boolean {
    return false;
  }
}

/**
 * Create a hasMany relation
 */
export function hasMany<TModel extends ModelLike>(
  target: Target<TModel>,
  config?: HasManyConfig,
): HasMany<TModel> {
  return new HasMany(target, config);
}

// Keep old name for backwards compat
export { HasMany as HasManyBuilder };
