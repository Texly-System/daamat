/**
 * Account Model
 *
 * OAuth/Auth provider accounts linked to users (Better Auth compatible)
 */

import { model } from "@damatjs/orm-model";
import { User } from "./user";

export const Account = model
  .define("accounts", {
    id: model.id({ prefix: "acc" }).primaryKey(),

    user: model.belongsTo(User, { foreignKey: "user_id" }).onDelete("CASCADE"),

    accountId: model.text(),
    providerId: model.text(),

    // OAuth tokens
    accessToken: model.text().nullable(),
    refreshToken: model.text().nullable(),
    accessTokenExpiresAt: model.timestamp({ withTimezone: true }).nullable(),
    refreshTokenExpiresAt: model.timestamp({ withTimezone: true }).nullable(),
    scope: model.text().nullable(),
    idToken: model.text().nullable(),

    // Password for credential auth
    password: model.text().nullable(),

    createdAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),
    updatedAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),
  })
  .indexes([
    { on: ["accountId"], name: "idx_accounts_account_id" },
    { on: ["providerId"], name: "idx_accounts_provider_id" },
    {
      on: ["providerId", "accountId"],
      unique: true,
      name: "uniq_accounts_provider_account",
    },
  ]);
