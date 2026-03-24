import type { HasOneConfig } from "@/types/relation";
import { Relation, ModelLike, Target } from "./base";

/**
 * HasOne - Inverse side of a one-to-one relationship
 *
 * Does NOT create any DB artifacts. This is metadata for the ORM.
 * The FK lives on the other side (the model with belongsTo + unique).
 *
 * Usage:
 * ```ts
 * const UserSchema = model('users', {
 *   // User has one profile (FK is on profiles table, unique)
 *   profile: hasOne(ProfileSchema, { inverse: 'user' })
 * })
 * ```
 */
export class HasOne<
  TModel extends ModelLike = ModelLike,
> extends Relation<TModel> {
  constructor(target: Target<TModel>, config?: HasOneConfig) {
    super("hasOne", target);

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
 * Create a hasOne relation
 */
export function hasOne<TModel extends ModelLike>(
  target: Target<TModel>,
  config?: HasOneConfig,
): HasOne<TModel> {
  return new HasOne(target, config);
}

// Keep old name for backwards compat
export { HasOne as HasOneBuilder };
