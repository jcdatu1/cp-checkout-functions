## Why

The store is receiving orders that contain only a shipping insurance (Route protection) line and no actual merchandise. These orders are meaningless to fulfil, create refund and support work, and pollute order and revenue reporting. They most likely arise when a buyer removes their real items and the Route widget leaves its insurance line behind, or when a stale cart reaches checkout through an accelerated path (Shop Pay, Apple Pay, Buy it now).

Checkout must refuse to proceed when the cart holds nothing but the insurance product.

## What Changes

- Add a Shopify Cart and Checkout Validation Function that inspects cart lines and returns a blocking error when **every** line's product has `productType == "Insurance"`.
- Set up the Shopify app scaffolding this repo currently lacks (`shopify.app.toml`, `extensions/`, `package.json`) to host the Function.
- Document and script the activation step: deploying the Function does not enable it; a Validation resource must be created in the store via the Admin API.
- The buyer sees a single cart-level error message telling them to add a product (or remove the protection) to continue.
- No UI extension in this change. Messaging is a plain error string.

## Capabilities

### New Capabilities

- `insurance-only-cart-validation`: block checkout when the cart consists solely of insurance-type products, with defined behavior for mixed, empty, and custom-line carts, and for Function failure.

### Modified Capabilities

None. The repository has no existing specs.

## Impact

- **New code**: one Function extension under `extensions/` (TypeScript), its GraphQL input query, and a unit test suite for the pure validation logic.
- **New repo files**: `shopify.app.toml`, `package.json`, lockfile, `.gitignore` entries.
- **Store configuration**: a Validation resource must be created once per store via `validationCreate` (Admin GraphQL API).
- **Dependencies**: Shopify CLI (already installed, 4.8.0), Node (24 installed), `vitest` for tests.
- **Constraint**: Functions in a custom app for a single store may require Shopify Plus. Store plan is unconfirmed (see design Open Questions).
- **Not covered**: Draft Orders, POS, and Admin-created orders do not run checkout validation and are out of scope.
