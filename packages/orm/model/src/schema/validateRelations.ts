import { ModelDefinition, ModelProperties } from "@/types";
import { BelongsToBuilder, HasManyBuilder, HasOneBuilder } from "../properties";

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
export function validateRelations(
  models: ModelDefinition<ModelProperties>[],
): ValidationResult {
  const errors: RelationValidationError[] = [];

  // Build a lookup map of models by table name
  const modelMap = new Map<string, ModelDefinition<ModelProperties>>();
  for (const model of models) {
    modelMap.set(model._tableName, model);
  }

  // Validate each model's relations
  for (const model of models) {
    for (const [propName, propValue] of Object.entries(model._properties)) {
      if (
        propValue instanceof HasManyBuilder ||
        propValue instanceof HasOneBuilder
      ) {
        // hasMany/hasOne should have a corresponding belongsTo on the target
        const targetTableName = propValue.getTargetTableName();
        const mappedBy = propValue.getMappedBy();
        const targetModel = modelMap.get(targetTableName);

        if (!targetModel) {
          // Target model not in the provided list - skip validation
          continue;
        }

        if (mappedBy) {
          // Check if target model has the mappedBy property as a belongsTo
          const targetProp = (
            targetModel._properties as Record<string, unknown>
          )[mappedBy];

          if (!targetProp) {
            const relationType =
              propValue instanceof HasManyBuilder ? "hasMany" : "hasOne";
            errors.push(
              new RelationValidationError(
                model._tableName,
                propName,
                "missing_belongsTo",
                `Model "${model._tableName}" has ${relationType}("${targetTableName}", { mappedBy: "${mappedBy}" }), ` +
                  `but model "${targetTableName}" does not have a property named "${mappedBy}". ` +
                  `Add a belongsTo relation: ${mappedBy}: model.belongsTo(${model._tableName})`,
              ),
            );
          } else if (!(targetProp instanceof BelongsToBuilder)) {
            const relationType =
              propValue instanceof HasManyBuilder ? "hasMany" : "hasOne";
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
      } else if (propValue instanceof BelongsToBuilder) {
        // belongsTo with mappedBy should have a corresponding hasMany/hasOne on the target
        const targetTableName = propValue.getTargetTableName();
        const mappedBy = propValue.getMappedBy();
        const targetModel = modelMap.get(targetTableName);

        if (!targetModel) {
          // Target model not in the provided list - skip validation
          continue;
        }

        if (mappedBy) {
          // Check if target model has the mappedBy property as a hasMany/hasOne
          const targetProp = (
            targetModel._properties as Record<string, unknown>
          )[mappedBy];

          if (!targetProp) {
            errors.push(
              new RelationValidationError(
                model._tableName,
                propName,
                "missing_hasMany",
                `Model "${model._tableName}" has belongsTo("${targetTableName}", { mappedBy: "${mappedBy}" }), ` +
                  `but model "${targetTableName}" does not have a property named "${mappedBy}". ` +
                  `Add a hasMany or hasOne relation: ${mappedBy}: model.hasMany(${model._tableName})`,
              ),
            );
          } else if (
            !(
              targetProp instanceof HasManyBuilder ||
              targetProp instanceof HasOneBuilder
            )
          ) {
            errors.push(
              new RelationValidationError(
                model._tableName,
                propName,
                "mappedBy_mismatch",
                `Model "${model._tableName}" has belongsTo("${targetTableName}", { mappedBy: "${mappedBy}" }), ` +
                  `but "${targetTableName}.${mappedBy}" is not a hasMany or hasOne relation. ` +
                  `The mappedBy property must be a hasMany or hasOne relation.`,
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
export function assertValidRelations(
  models: ModelDefinition<ModelProperties>[],
): void {
  const result = validateRelations(models);
  if (!result.valid) {
    throw result.errors[0];
  }
}
