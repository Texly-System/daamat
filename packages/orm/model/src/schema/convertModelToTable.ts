// import {
//   TableSchema,
//   PrimaryKeySchema,
//   ColumnSchema,
//   IndexSchema,
//   ForeignKeySchema,
//   RelationSchema,
//   ModelDefinition,
//   ModelProperties,
// } from "@/types";
// import {
//   ColumnBuilder,
//   BelongsToBuilder,
//   HasManyBuilder,
//   HasOneBuilder,
//   convertIndexDefinition,
// } from "../properties";

// /**
//  * Convert a model definition to TableSchema
//  */
// export function convertModelToTableSchema<T extends ModelProperties>(
//   model: ModelDefinition<T>,
// ): TableSchema {
//   const columns: ColumnSchema[] = [];
//   const foreignKeys: ForeignKeySchema[] = [];
//   const indexSchemas: IndexSchema[] = [];
//   const relations: RelationSchema[] = [];
//   let primaryKeyColumns: string[] = [];
//   let primaryKeyName = `${model._tableName}_pkey`;

//   // Process each property
//   for (const [propName, propValue] of Object.entries(model._properties)) {
//     if (propValue instanceof ColumnBuilder) {
//       // Set the column name
//       propValue._setName(propName);
//       const columnSchema = propValue.toSchema();
//       columns.push(columnSchema);

//       // Track primary key columns
//       if (columnSchema.primaryKey) {
//         primaryKeyColumns.push(propName);
//       }
//     } else if (propValue instanceof BelongsToBuilder) {
//       // Set the property name so getForeignKeyColumn() can use it for default naming
//       propValue._setPropertyName(propName);

//       // BelongsTo creates a foreign key column
//       const fkColumnName = propValue.getForeignKeyColumn();
//       const columnBuilder = propValue.toColumnBuilder();
//       columnBuilder._setName(fkColumnName);
//       columns.push(columnBuilder.toSchema());

//       // Get the target table name
//       const targetTableName = propValue.toDefinition().target();
//       foreignKeys.push(
//         propValue.toForeignKeySchema(
//           model._tableName,
//           fkColumnName,
//           targetTableName,
//         ),
//       );
//     } else if (
//       propValue instanceof HasManyBuilder ||
//       propValue instanceof HasOneBuilder
//     ) {
//       // HasMany and HasOne don't create columns - capture as relation metadata
//       const relationSchema: RelationSchema = {
//         name: propName,
//         type: propValue instanceof HasManyBuilder ? "hasMany" : "hasOne",
//         targetTable: propValue.getTargetTableName(),
//       };

//       const mappedBy = propValue.getMappedBy();
//       if (mappedBy !== undefined) {
//         relationSchema.mappedBy = mappedBy;
//       }

//       relations.push(relationSchema);
//     }
//   }

//   // Convert index definitions to IndexSchema
//   model._indexes.forEach((indexDef, idx) => {
//     indexSchemas.push(convertIndexDefinition(model._tableName, indexDef, idx));
//   });

//   // Build primary key schema
//   const primaryKey: PrimaryKeySchema = {
//     name: primaryKeyName,
//     columns: primaryKeyColumns,
//   };

//   // Build the table schema
//   const tableSchema: TableSchema = {
//     name: model._tableName,
//     columns,
//     indexes: indexSchemas,
//     foreignKeys,
//     primaryKey,
//     relations,
//   };

//   if (model._schemaName !== undefined) {
//     tableSchema.schema = model._schemaName;
//   }

//   return tableSchema;
// }
