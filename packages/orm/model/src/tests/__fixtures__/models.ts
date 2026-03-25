/**
 * Sample domain models used across the transform test suite.
 *
 * Domain: a tiny e-commerce schema
 *
 *   User  ──< Order ──< OrderItem >── Product
 *                                      │
 *                                   Category
 *
 * Relationships:
 *   - Order    belongsTo User           (user_id FK)
 *   - OrderItem belongsTo Order         (order_id FK)
 *   - OrderItem belongsTo Product       (product_id FK)
 *   - Product   belongsTo Category      (category_id FK, nullable)
 *   - User      hasMany   Order         (inverse, no FK column)
 *   - Order     hasMany   OrderItem     (inverse, no FK column)
 *   - Product   hasMany   OrderItem     (inverse, no FK column)
 *   - Category  hasMany   Product       (inverse, no FK column)
 */

export * from "./category";
export * from "./order";
export * from "./orderItem";
export * from "./product";
export * from "./user";

// Re-export with old names for backward compatibility with tests
export { CategorySchema as Category } from "./category";
export { OrderSchema as Order } from "./order";
export { OrderItemSchema as OrderItem } from "./orderItem";
export { ProductSchema as Product } from "./product";
export { UserSchema as User } from "./user";
