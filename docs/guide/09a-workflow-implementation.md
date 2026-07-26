[Damat Guide](../GUIDE.md) › Workflows

# 9.1 Implement a workflow

A step has a forward function and, when needed, a compensation function. The
forward function returns `StepResponse(output, compensationInput)`. Only the
compensation input is passed to the rollback function.

```ts
import {
  Effect,
  StepResponse,
  createStep,
  createWorkflow,
  getModule,
} from "@damatjs/framework";

const createProfile = createStep<NewUser, User, string>(
  "create-profile",
  async (input) => {
    const users = getModule("user");
    const user = await users.users.create({
      data: input,
      returning: ["id", "email"],
    });
    return new StepResponse(user, user.id);
  },
  async (userId) => {
    const users = getModule("user");
    await users.users.delete({ where: { id: userId } });
  },
);

const createPreferences = createStep<User, Preferences, string>(
  "create-preferences",
  async (user) => {
    const users = getModule("user");
    const preferences = await users.preferences.create({
      data: { userId: user.id, locale: "en" },
    });
    return new StepResponse(preferences, preferences.id);
  },
  async (preferencesId) => {
    const users = getModule("user");
    await users.preferences.delete({ where: { id: preferencesId } });
  },
);

export const onboardUser = createWorkflow(
  "user-onboarding",
  (input: NewUser, context) =>
    Effect.gen(function* () {
      const user = yield* createProfile(input, context);
      const preferences = yield* createPreferences(user, context);
      return { user, preferences };
    }),
  { timeoutMs: 60_000 },
);
```

Run it and inspect the result instead of assuming an exception shape:

```ts
const result = await onboardUser.execute(input);
if (!result.success) {
  logger.error("onboarding failed", {
    code: result.error.code,
    compensated: result.compensated,
    compensationErrors: result.compensationErrors,
  });
}
```

Pass the `AbortSignal` supplied to a step into network or database calls that
support cancellation. A timeout cannot stop work that ignores its signal.

---

Prev: [← Workflows](./09-workflows.md) · [Guide home](../GUIDE.md) · Next: [Workflow reliability and errors →](./09b-workflows-reliability.md)
