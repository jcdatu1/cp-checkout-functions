# cp-checkout-functions

Shopify Functions for the store's checkout.

## insurance-only-cart-validation

Blocks checkout when **every** cart line is a product with product type `Insurance` (the Route
shipping-protection product). Mixed carts, carts with no insurance, custom lines and empty carts
are not affected. The match ignores case and surrounding whitespace.

Buyer-facing message (shown at the cart level): _"Your cart contains only shipping protection.
Please add a product to continue."_

Rule and messages live in
[extensions/insurance-only-cart-validation/src/validate.ts](extensions/insurance-only-cart-validation/src/validate.ts).

### Develop

```
npm install
npm run typecheck
npm test            # unit tests + Wasm integration tests
```

The integration tests (`tests/default.test.js`) build the Function with the Shopify CLI, which needs
a linked app: run `shopify app config link` (or `shopify app init`) once so `shopify.app.toml`
exists. The unit tests in `src/` have no such requirement.

### Deploy and activate

Deploying the Function does **not** enable it. A Validation resource must exist in the store.

1. `shopify app deploy`, then install the app on the store.
2. Create the Validation with the Admin GraphQL API (for example from the GraphiQL that
   `shopify app dev` offers, or `shopify app execute`):

   ```graphql
   mutation {
     validationCreate(
       validation: {
         functionHandle: "insurance-only-cart-validation"
         enable: true
         blockOnFailure: false
       }
     ) {
       validation { id enabled blockOnFailure }
       userErrors { field message code }
     }
   }
   ```

   `blockOnFailure: false` means that if the Function itself fails at runtime, checkout proceeds
   instead of being blocked for everyone.

3. Verify it exists and is enabled:

   ```graphql
   query {
     validations(first: 10) {
       nodes { id enabled blockOnFailure shopifyFunction { title } }
     }
   }
   ```

> These GraphQL snippets have not been run against a live store yet. If a field name is rejected,
> check it against the Admin API version the app uses.

### Rollback

Disable or remove the Validation. No redeploy is needed and the effect is immediate.

```graphql
mutation { validationUpdate(id: "gid://shopify/Validation/…", validation: { enable: false }) {
  userErrors { message } } }

mutation { validationDelete(id: "gid://shopify/Validation/…") { userErrors { message } } }
```

### Not covered

Draft Orders, POS and Admin-created orders do not run checkout validation. The observed
insurance-only orders came through the online store channel, which this does cover.
