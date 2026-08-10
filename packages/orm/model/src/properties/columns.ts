import { primitiveColumns } from "./columnFactories";
import { relationFactories } from "./relationFactories";

/** Public column, relation, index, and constraint builder factory. */
export const columns = {
  ...primitiveColumns,
  ...relationFactories,
};
