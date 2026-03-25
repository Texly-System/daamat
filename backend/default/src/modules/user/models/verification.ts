/**
 * Verification Model
 *
 * Email verification tokens (Better Auth compatible)
 */

import { model } from "@damatjs/orm-model";

export const Verification = model
  .define("verifications", {
    id: model.id({ prefix: "ver" }).primaryKey(),

    identifier: model.text(), // email or phone
    value: model.text(), // token or code

    expiresAt: model.timestamp({ withTimezone: true }),

    createdAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),
    updatedAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),
  })
  .indexes([{ on: ["identifier"], name: "idx_verifications_identifier" }]);
