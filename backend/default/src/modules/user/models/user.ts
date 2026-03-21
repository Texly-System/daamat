/**
 * User Model
 *
 * Core user identity for authentication (Better Auth compatible)
 */

import { model } from "@damatjs/orm-model";

export const User = model
  .define("users", {
    id: model.id({ prefix: "usr" }).primaryKey(),

    email: model.text(),
    emailVerified: model.boolean().default(false),
    name: model.text().nullable(),
    image: model.text().nullable(),

    createdAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),
    updatedAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),
    deletedAt: model.timestamp({ withTimezone: true }).nullable(),
  })
  .indexes([{ on: ["email"], unique: true, name: "uniq_users_email" }]);
