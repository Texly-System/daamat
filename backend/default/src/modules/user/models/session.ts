/**
 * Session Model
 *
 * User sessions for authentication (Better Auth compatible)
 */

import { model } from "@damatjs/orm-model";
import { User } from "./user";

export const Session = model
  .define("sessions", {
    id: model.id({ prefix: "ses" }).primaryKey(),

    user: model.belongsTo(User, { foreignKey: "user_id" }).onDelete("CASCADE"),

    token: model.text(),
    expiresAt: model.timestamp({ withTimezone: true }),

    ipAddress: model.varchar(45).nullable(),
    userAgent: model.text().nullable(),

    createdAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),
    updatedAt: model.timestamp({ withTimezone: true }).defaultRaw("now()"),
  })
  .indexes([
    { on: ["user_id"], name: "idx_sessions_user_id" },
    { on: ["token"], unique: true, name: "uniq_sessions_token" },
  ]);
