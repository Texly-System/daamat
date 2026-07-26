[Damat Guide](../GUIDE.md) › Provider implementation and integration

# 8.5 Implement and bind a provider

A provider is still a normal module. The only extra piece is a standard role
contract, such as payment or subscription, that application code can access
through `getProvider(role)`.

## Implement the complete role contract

The strict base extends `ModuleService`. Put vendor SDK calls and signature
verification in small `src/lib/` helpers so the service remains readable.

```ts
import { PaymentProviderService } from "@damatjs/provider-payment";

const Base = PaymentProviderService({
  models,
  credentialsSchema,
  cache: { prefix: "billing" },
  events: true,
});

export class BillingService extends Base {
  async createPayment(input) {
    const payment = await chargeVendor(input, this.credentials);
    await this.payments.create({ data: payment });
    return payment;
  }

  getPayment(id) {
    return this.payments.findById(id);
  }

  listPayments(input) {
    return listVendorPayments(input, this.credentials);
  }

  capturePayment(input) {
    return captureVendorPayment(input, this.credentials);
  }

  cancelPayment(input) {
    return cancelVendorPayment(input, this.credentials);
  }

  refundPayment(input) {
    return refundVendorPayment(input, this.credentials);
  }

  getRefund(id) {
    return findVendorRefund(id, this.credentials);
  }

  parseWebhook(input) {
    return verifyAndParseVendorWebhook(input, this.credentials);
  }
}
```

The role-specific base makes an incomplete implementation fail type checking.
Use the provider package README for the exact input and output types.

## Install, migrate, and bind

```bash
damat module plan <registry-ref|path|git-url>
damat module add <registry-ref|path|git-url>
bun run db:migrate
```

```ts
modules: {
  billing: { resolve: "./src/modules/billing" },
},
providers: {
  payment: { module: "billing" },
},
```

Each role selects one already initialized module service. There is no second
provider instance, automatic discovery, or provider-owned database pool. Only
the auth role participates in framework request authentication; payment and
subscription calls remain application-owned behavior.

---

Prev: [← Integration providers](./08c-providers.md) · [Guide home](../GUIDE.md) · Next: [Workflows →](./09-workflows.md)
