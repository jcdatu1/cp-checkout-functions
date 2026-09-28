## 1. Pre-flight checks

- [x] 1.1 Confirm the target store's plan (Shopify Plus or not) and decide app distribution accordingly (confirmed by user: Shopify Plus, so a custom single-store app is fine)
- [x] 1.2 Read the exact `productType` string of the Route protection product in the Admin and record it (confirmed by user: `Insurance`)
- [x] 1.3 Check the source channel of several existing insurance-only orders to confirm they came through checkout (confirmed by user: online store channel only)

## 2. Scaffold the app

- [x] 2.1 Initialize `package.json` and install dependencies (`vitest`, TypeScript)
- [x] 2.2 Create or link the Shopify app with the CLI to produce `shopify.app.toml` (skipped by request: user will link the app and test manually; `shopify.app.toml` is intentionally not committed here)
- [x] 2.3 Generate a Cart and Checkout Validation Function extension in TypeScript under `extensions/` (assembled by hand from Shopify's `functions-cart-checkout-validation-js` template, API `2026-07`)
- [x] 2.4 Add `.gitignore` entries for `node_modules`, build output, and CLI-generated local files

## 3. Implement the validation

- [x] 3.1 Write the input query fetching `merchandise.__typename` and `product.productType` per line
- [x] 3.2 Implement the pure validation function: block when `lines.length > 0` and every line is an `Insurance` product variant (case-insensitive, trimmed)
- [x] 3.3 Define `BLOCKED_PRODUCT_TYPE` and the buyer-facing error message as constants
- [x] 3.4 Wire the pure function into the `run` entrypoint, returning one `validationAdd` error at `$.cart` or no operations
- [x] 3.5 Regenerate types from the schema and make the extension build cleanly (the extension builds to Wasm; `typegen` was not run because the entrypoint uses local types, see design D6)

## 4. Tests

- [x] 4.1 Unit tests: insurance-only cart (one line and several lines) is blocked
- [x] 4.2 Unit tests: type differing by case and whitespace is blocked
- [x] 4.3 Unit tests: insurance plus merchandise, no insurance, and custom-line carts are allowed
- [x] 4.4 Unit test: empty cart returns no errors
- [x] 4.5 Unit test: the error targets `$.cart` and there is exactly one
- [x] 4.6 Run `shopify app function run` against fixture inputs for a blocked and an allowed cart (done via the template's integration test in `tests/`, which builds the Wasm and runs it against blocked, mixed and custom-line fixtures)

## 5. Activation and rollout

- [x] 5.1 Write the `validationCreate` mutation (`functionHandle`, `enable: true`, `blockOnFailure: false`) and a verification query, documented in the repo README
- [ ] 5.2 Deploy to a dev store and activate the validation
- [ ] 5.3 Manually verify on the dev store: insurance-only cart blocked, mixed cart passes, including via an accelerated checkout path
- [ ] 5.4 Check where the error is displayed (cart page vs checkout) and adjust the message wording if needed
- [ ] 5.5 Test with the Route widget live to confirm the buyer can recover (add a product or remove protection)
- [ ] 5.6 Deploy to production, run the activation step, and confirm with a real insurance-only cart
- [x] 5.7 Document rollback (disable or delete the Validation resource) (in README)
