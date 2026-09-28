## Context

The store sells normal merchandise plus a Route shipping-protection product (a separate Shopify product with product type `Insurance`, added to the cart by the Route widget). Some orders arrive containing only the protection line. The repository (`cp-checkout-functions`) is empty apart from tooling config, so this change also creates the Shopify app skeleton.

Shopify offers two ways to gate checkout: a Cart and Checkout Validation Function (server-side, runs on every path into checkout including accelerated ones) and a Checkout UI extension using `buyerJourney.intercept` (client-side). The exploration concluded that only the Function is authoritative, and the user approved a Function-only approach.

## Goals / Non-Goals

**Goals:**
- Reliably block checkout when the cart is insurance-only, on all checkout entry paths.
- Keep the rule tiny, pure, and unit-testable.
- Make activation explicit and repeatable so a deployed-but-inactive Function is not mistaken for a bug.

**Non-Goals:**
- Custom checkout UI or rich messaging (no UI extension).
- Merchant-configurable product type via metafield or admin UI.
- Covering Draft Orders, POS, or Admin-created orders (they bypass checkout validation).
- Removing the insurance line automatically (that would be a Cart Transform, a different feature).
- Vendor-specific matching for Route.

## Decisions

### D1: Cart and Checkout Validation Function, no UI extension
Target `cart.validations.generate.run`. It is enforced by Shopify in the checkout pipeline, so it also covers Shop Pay, Apple Pay and Buy it now. A UI extension would be client-side and add React, a bundle, and a weaker guarantee for no gain in this use case.
*Alternative rejected:* `buyerJourney.intercept` UI extension; kept as a possible later addition for better messaging.

### D2: Rule is "every line is Insurance", not "only the Route product"
The predicate is `lines.length > 0 && lines.every(isInsurance)`. It matches on product type only, not vendor or handle. This also blocks a future non-Route insurance product sold alone, which is the desired behavior.
*Alternative rejected:* additionally requiring vendor `Route`; narrower but adds a second string that can drift.

### D3: Lines without a product count as non-insurance
Only `ProductVariant` merchandise with a product can be insurance. Custom lines (`CustomProduct`) have no product and therefore make the cart pass. This errs toward letting checkout proceed.

### D4: Case-insensitive, trimmed comparison against a single constant
`productType` is free text, so `Insurance`, `insurance` and `Insurance ` are treated the same. The target string lives in one named constant (`BLOCKED_PRODUCT_TYPE`) rather than being configurable.
*Alternative rejected for v1:* Function metafield configuration. It adds admin-side setup for a rule that has one value; revisit if the type changes or the code is reused across stores.

### D5: Input query fetches only what is needed
```graphql
query CartValidationsGenerateRunInput {
  cart {
    lines {
      merchandise {
        __typename
        ... on ProductVariant { product { productType } }
      }
    }
  }
}
```
Output is always a single `validationAdd` operation, matching Shopify's template: it carries one error at target `$.cart` when the cart is blocked, and an empty `errors` list when the cart is allowed.

### D6: Separate pure logic from the Function entrypoint
A pure function (`cart lines in, error list out`) holds the rule and is unit-tested with `vitest`. The `cartValidationsGenerateRun` entrypoint (a named export re-exported from `src/index.ts`, per Shopify's current JS template) only adapts input and output shapes. It uses small local types rather than the generated `generated/api.ts`, so typechecking does not depend on running `typegen`. The template's fixture-based integration test builds the Wasm and runs it against fixture JSON as the end-to-end check.

### D7: TypeScript, `blockOnFailure: false`
TypeScript from the Shopify CLI template (Node 24 and CLI 4.8.0 are installed). Activation uses `blockOnFailure: false`: this rule prevents a nuisance, not a legal or safety violation, so a Function crash must never stop revenue.

### D8: Explicit activation step
A deployed validation Function does nothing until a Validation resource exists. The change includes a documented `validationCreate` GraphQL call (`functionHandle`, `enable: true`, `blockOnFailure: false`), runnable via the CLI, plus a query to verify it.

## Risks / Trade-offs

- **Wrong `productType` string** → the rule silently never fires. *Mitigation:* verify the exact value on the Route product in the Admin before implementing, and test on a dev store with a real insurance-only cart.
- **Store plan** → Cart and Checkout Validation in a custom app for one store may be limited to Shopify Plus. *Mitigation:* confirm the plan first; if not Plus, the app must be distributed differently (see Open Questions).
- **Route widget behavior** → Route may re-add or fight with the cart, leaving the buyer with a persistent error. *Mitigation:* clear message telling them to add a product; test the flow with the widget live.
- **Error visibility** → the message may appear only in checkout, not on the cart page. *Mitigation:* verify on a dev store; accept if so.
- **Bypass channels** → Draft Orders, POS, and Admin orders are unaffected. *Mitigation:* check the source channel of existing bad orders; document as out of scope.
- **Fail-open** → if the Function fails, insurance-only orders can slip through again. Accepted trade-off (D7).

## Migration Plan

1. Scaffold the app and Function, link it to the target store via the Shopify CLI.
2. Deploy to a dev store, run the activation step, and verify the scenarios manually.
3. Deploy to production and run the activation step there.
4. Rollback: disable or delete the Validation resource (immediate, no redeploy needed).

## Open Questions

1. Is the production store on Shopify Plus (needed if the app is custom, single-store)? If not, what distribution model applies?
2. ~~What is the exact `productType` value on the Route product?~~ Resolved: the user confirmed it is `Insurance`.
3. Should the app be one store's private app or reusable across client stores? This affects D4 (a metafield config may become worthwhile).
4. Did any of the observed insurance-only orders come from Draft Orders, POS, or Admin? If so, they need a separate solution.
