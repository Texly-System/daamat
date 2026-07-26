import { ZodError } from "@damatjs/deps/zod";
import type { Context } from "@damatjs/deps/hono";

export function requiredTarget(
  target: "Body" | "Json" | "Query" | "Params",
): ZodError {
  return new ZodError([
    {
      code: "custom",
      message: `${target} is required`,
      path: [target.toLowerCase()],
    },
  ]);
}

export function validationResponse(context: Context, error: ZodError) {
  return context.json(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    },
    400,
  );
}

export function jsonSyntaxError(message: string): ZodError {
  return new ZodError([{ code: "custom", message, path: ["body"] }]);
}
