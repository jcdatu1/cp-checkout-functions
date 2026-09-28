## ADDED Requirements

### Requirement: Block carts containing only insurance products
The system SHALL block checkout when the cart has at least one line and every cart line is a product variant whose product type is `Insurance`. The product type comparison SHALL ignore case and surrounding whitespace.

#### Scenario: Cart contains only the insurance product
- **WHEN** the cart has a single line whose product type is `Insurance`
- **THEN** checkout is blocked with a validation error

#### Scenario: Cart contains several insurance lines and nothing else
- **WHEN** the cart has multiple lines and every line's product type is `Insurance`
- **THEN** checkout is blocked with a validation error

#### Scenario: Product type differs only by case or whitespace
- **WHEN** the cart's only line has product type `" insurance "`
- **THEN** checkout is blocked with a validation error

### Requirement: Allow carts that contain any non-insurance product
The system SHALL NOT block checkout when the cart contains at least one line that is not an insurance-type product.

#### Scenario: Insurance alongside merchandise
- **WHEN** the cart has one `Insurance` line and one line of any other product type
- **THEN** checkout is allowed and no validation error is returned

#### Scenario: No insurance in the cart
- **WHEN** no cart line has product type `Insurance`
- **THEN** checkout is allowed and no validation error is returned

#### Scenario: Cart contains a custom line
- **WHEN** the cart has an `Insurance` line and a custom line that has no associated product
- **THEN** the custom line counts as non-insurance and checkout is allowed

### Requirement: Ignore empty carts
The system SHALL NOT return a validation error for a cart with no lines, leaving empty-cart handling to Shopify.

#### Scenario: Empty cart
- **WHEN** the cart has zero lines
- **THEN** no validation error is returned

### Requirement: Explain the block to the buyer
The validation error SHALL be attached to the cart target and SHALL tell the buyer that the cart contains only shipping protection and that they need to add a product to continue.

#### Scenario: Error is shown at the cart level
- **WHEN** checkout is blocked by this rule
- **THEN** exactly one error is returned, targeted at `$.cart`, whose message states that the cart contains only shipping protection and asks the buyer to add a product

### Requirement: Fail open on Function failure
The validation SHALL be activated with `blockOnFailure` set to `false`, so that a runtime failure in the Function does not prevent buyers from checking out.

#### Scenario: Function crashes at runtime
- **WHEN** the Function throws or exceeds its resource limits during a checkout
- **THEN** checkout proceeds as if no validation were configured

### Requirement: Validation must be explicitly activated
Deploying the Function SHALL NOT be treated as enabling the rule. The change SHALL provide a documented, repeatable way to create the store's Validation resource pointing at the Function with `enable: true`.

#### Scenario: Function deployed but not activated
- **WHEN** the Function is deployed and no Validation resource exists
- **THEN** the rule is not enforced, and the documented activation step is what turns it on

#### Scenario: Activation completed
- **WHEN** the Validation resource exists and is enabled
- **THEN** an insurance-only cart is blocked at checkout
