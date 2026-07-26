import { ZodError } from "@damatjs/deps/zod";
import { ValidationError } from "@damatjs/types";
import type { MiddlewareHandler } from "@damatjs/deps/hono";
import type { RouteValidator, ValidatedData } from "../router/types";
import { VALIDATED_CONTEXT_KEY } from "../router/types";
import {
  jsonSyntaxError,
  requiredTarget,
  validationResponse,
} from "./validationResponse";

export function validate<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError("Validation failed", error.issues);
    }
    throw error;
  }
}

export function createValidatorMiddleware(
  handler: RouteValidator,
): MiddlewareHandler {
  return async (c, next) => {
    const wantsJson = handler.body !== undefined || handler.json !== undefined;
    let parsedBody: unknown;
    if (wantsJson) {
      const text =
        typeof c.req.text === "function"
          ? await c.req.text()
          : JSON.stringify(await c.req.json());
      if (text === undefined || text.length === 0) {
        const target = handler.body ? "Body" : "Json";
        return validationResponse(c, requiredTarget(target));
      }
      try {
        parsedBody = JSON.parse(text);
      } catch {
        return validationResponse(c, jsonSyntaxError("Malformed JSON body"));
      }
    }
    const validated: ValidatedData = {};
    try {
      if (handler.body) {
        validated.body = handler.body.parse(parsedBody);
      }
      if (handler.query) {
        const query = c.req.query();
        if (query === undefined) throw requiredTarget("Query");
        validated.query = handler.query.parse(query);
      }
      if (handler.params) {
        const params = c.req.param();
        if (params === undefined) throw requiredTarget("Params");
        validated.params = handler.params.parse(params);
      }
      if (handler.json) {
        const parsed = handler.json.parse(parsedBody);
        validated.json = parsed;
        c.req.addValidatedData("json", parsed as object);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return validationResponse(c, error);
      }
      throw error;
    }
    c.set(VALIDATED_CONTEXT_KEY, validated);
    return next();
  };
}
