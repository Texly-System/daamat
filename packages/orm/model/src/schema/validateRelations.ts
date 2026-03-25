import { ModelDefinition } from "./model";
import { BelongsTo, HasMany, HasOne } from "../properties";

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
 * 1. If Model A has `hasMany(B, { inverse: "a" })`, then Model B should have a `belongsTo` property named "a"
 * 2. If Model A has `hasOne(B, { inverse: "a" })`, then Model B should have a `belongsTo` property named "a"
 * 3. If Model A has `belongsTo(B, { inverse: "as" })`, then Model B should have a `hasMany` or `hasOne` property named "as"
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
        // hasMany/hasOne should have a corresponding belongsTo on the target
        const targetTableName = propValue.getTargetTable();
        const inverse = propValue.getInverse();
        const targetModel = modelMap.get(targetTableName);

        if (!targetModel) {
          // Target model not in the provided list - skip validation
          continue;
        }

        if (inverse) {
          // Check if target model has the inverse property as a belongsTo
          const targetProp = (
            targetModel._properties as Record<string, unknown>
          )[inverse];

          if (!targetProp) {
            const relationType =
              propValue instanceof HasMany ? "hasMany" : "hasOne";
            errors.push(
              new RelationValidationError(
                model._tableName,
                propName,
                "missing_belongsTo",
                `Model "${model._tableName}" has ${relationType}("${targetTableName}", { inverse: "${inverse}" }), ` +
                  `but model "${targetTableName}" does not have a property named "${inverse}". ` +
                  `Add a belongsTo relation: ${inverse}: belongsTo(${model._tableName})`,
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
                `Model "${model._tableName}" has ${relationType}("${targetTableName}", { inverse: "${inverse}" }), ` +
                  `but "${targetTableName}.${inverse}" is not a belongsTo relation. ` +
                  `The inverse property must be a belongsTo relation.`,
              ),
            );
          }
        }
      } else if (propValue instanceof BelongsTo) {
        // belongsTo with inverse should have a corresponding hasMany/hasOne on the target
        const targetTableName = propValue.getTargetTable();
        const inverse = propValue.getInverse();
        const targetModel = modelMap.get(targetTableName);

        if (!targetModel) {
          // Target model not in the provided list - skip validation
          continue;
        }

        if (inverse) {
          // Check if target model has the inverse property as a hasMany/hasOne
          const targetProp = (
            targetModel._properties as Record<string, unknown>
          )[inverse];

          if (!targetProp) {
            errors.push(
              new RelationValidationError(
                model._tableName,
                propName,
                "missing_hasMany",
                `Model "${model._tableName}" has belongsTo("${targetTableName}", { inverse: "${inverse}" }), ` +
                  `but model "${targetTableName}" does not have a property named "${inverse}". ` +
                  `Add a hasMany or hasOne relation: ${inverse}: hasMany(${model._tableName})`,
              ),
            );
          } else if (
            !(targetProp instanceof HasMany || targetProp instanceof HasOne)
          ) {
            errors.push(
              new RelationValidationError(
                model._tableName,
                propName,
                "mappedBy_mismatch",
                `Model "${model._tableName}" has belongsTo("${targetTableName}", { inverse: "${inverse}" }), ` +
                  `but "${targetTableName}.${inverse}" is not a hasMany or hasOne relation. ` +
                  `The inverse property must be a hasMany or hasOne relation.`,
              ),
            );
          }
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
