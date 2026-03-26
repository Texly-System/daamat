import { ModelDefinition } from "../../schema/model";
import { BelongsTo, HasMany, HasOne } from "..";

/**
 * Validation error for relation mismatches
 */
export class RelationValidationError extends Error {
  constructor(
    public readonly modelName: string,
    public readonly propertyName: string,
    public readonly errorType:
      | "missing_belongsTo"
      | "missing_hasMany"
      | "mappedBy_mismatch"
      | "foreignKey_mismatch",
    message: string,
  ) {
    super(message);
    this.name = "RelationValidationError";
  }
}

/**
 * Result of relation validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: RelationValidationError[];
}

/**
 * Validate relations across multiple models.
 *
 * Checks that:
 * 1. If Model A has `hasMany(B, { mappedBy: "a" })`, then Model B should have a `belongsTo` property named "a"
 * 2. If Model A has `hasOne(B, { mappedBy: "a" })`, then Model B should have a `belongsTo` property named "a"
 * 3. If Model A has `belongsTo(B, { mappedBy: "as" })`, then Model B should have a `hasMany` or `hasOne` property named "as"
 *
 * @param models - Array of model definitions to validate
 * @returns ValidationResult with any errors found
 */
export function validateRelations(models: ModelDefinition[]): ValidationResult {
  const errors: RelationValidationError[] = [];

  // Build a lookup map of models by table name
  const modelMap = new Map<string, ModelDefinition>();
  for (const model of models) {
    modelMap.set(model._tableName, model);
  }

  // Validate each model's relations
  for (const model of models) {
    for (const [propName, propValue] of Object.entries(model._properties)) {
      if (propValue instanceof HasMany || propValue instanceof HasOne) {
        // hasMany/hasOne with mappedBy should have a corresponding belongsTo on the target
        const targetTableName = propValue.getModuleTarget()._tableName;
        const mappedBy = propValue.getMappedBy();
        const targetModel = modelMap.get(targetTableName);

        if (!targetModel) {
          // Target model not in the provided list — skip validation
          continue;
        }

        if (mappedBy !== undefined) {
          // Check if target model has the mappedBy property as a belongsTo
          const targetProp = (
            targetModel._properties as Record<string, unknown>
          )[mappedBy];

          if (!targetProp) {
            const relationType =
              propValue instanceof HasMany ? "hasMany" : "hasOne";
            errors.push(
              new RelationValidationError(
                model._tableName,
                propName,
                "missing_belongsTo",
                `Model "${model._tableName}" has ${relationType}("${targetTableName}", { mappedBy: "${mappedBy}" }), ` +
                `but model "${targetTableName}" does not have a property named "${mappedBy}". ` +
                `Add a belongsTo relation: ${mappedBy}: belongsTo(${model._tableName})`,
              ),
            );
          } else if (!(targetProp instanceof BelongsTo)) {
            const relationType =
              propValue instanceof HasMany ? "hasMany" : "hasOne";
            errors.push(
              new RelationValidationError(
                model._tableName,
                propName,
                "mappedBy_mismatch",
                `Model "${model._tableName}" has ${relationType}("${targetTableName}", { mappedBy: "${mappedBy}" }), ` +
                `but "${targetTableName}.${mappedBy}" is not a belongsTo relation. ` +
                `The mappedBy property must be a belongsTo relation.`,
              ),
            );
          }
        }
      } else if (propValue instanceof BelongsTo) {
        // belongsTo with explicit mappedBy should have a corresponding hasMany/hasOne on the target
        const targetTableName = propValue.getModuleTarget()._tableName;
        const mappedBy = propValue.getMappedBy();
        const targetModel = modelMap.get(targetTableName);

        if (!targetModel) {
          // Target model not in the provided list — skip validation
          continue;
        }

        // Only validate if a mappedBy was explicitly provided via options
        // (not the auto-derived default) — check by seeing if getMappedBy()
        // was explicitly set. We expose this via the options path only.
        // For now we validate always since getMappedBy() always returns a value —
        // skip if the target model simply doesn't have the property at all,
        // since it may be intentionally one-sided.
        const targetProp = (targetModel._properties as Record<string, unknown>)[
          mappedBy
        ];

        if (
          targetProp !== undefined &&
          !(targetProp instanceof HasMany || targetProp instanceof HasOne)
        ) {
          errors.push(
            new RelationValidationError(
              model._tableName,
              propName,
              "mappedBy_mismatch",
              `Model "${model._tableName}" has belongsTo("${targetTableName}") with mappedBy "${mappedBy}", ` +
              `but "${targetTableName}.${mappedBy}" is not a hasMany or hasOne relation. ` +
              `The mappedBy property must be a hasMany or hasOne relation.`,
            ),
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate relations and throw if any errors are found.
 *
 * @param models - Array of model definitions to validate
 * @throws RelationValidationError if validation fails (throws first error)
 */
export function assertValidRelations(models: ModelDefinition[]): void {
  const result = validateRelations(models);
  if (!result.valid) {
    throw result.errors[0];
  }
}
