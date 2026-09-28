import { describe, expect, it } from "vitest";
import { cartValidationsGenerateRun as run } from "./cart_validations_generate_run";
import { ERROR_MESSAGE, ERROR_TARGET, type CartLine } from "./validate";

const variant = (productType: string | null): CartLine => ({
  merchandise: { __typename: "ProductVariant", product: { productType } },
});
const customLine: CartLine = { merchandise: { __typename: "CustomProduct" } };

const runWith = (lines: CartLine[]) => run({ cart: { lines } });

const blocked = {
  operations: [
    { validationAdd: { errors: [{ message: ERROR_MESSAGE, target: ERROR_TARGET }] } },
  ],
};
const allowed = { operations: [{ validationAdd: { errors: [] } }] };

describe("insurance-only cart validation", () => {
  describe("blocks", () => {
    it("a cart with a single insurance line", () => {
      expect(runWith([variant("Insurance")])).toEqual(blocked);
    });

    it("a cart with several insurance lines and nothing else", () => {
      expect(runWith([variant("Insurance"), variant("Insurance")])).toEqual(blocked);
    });

    it("a product type differing only by case and whitespace", () => {
      expect(runWith([variant(" insurance ")])).toEqual(blocked);
    });
  });

  describe("allows", () => {
    it("insurance alongside merchandise", () => {
      expect(runWith([variant("Insurance"), variant("T-Shirt")])).toEqual(allowed);
    });

    it("a cart with no insurance", () => {
      expect(runWith([variant("T-Shirt"), variant("Hat")])).toEqual(allowed);
    });

    it("insurance alongside a custom line with no product", () => {
      expect(runWith([variant("Insurance"), customLine])).toEqual(allowed);
    });

    it("insurance alongside a product with an empty type", () => {
      expect(runWith([variant("Insurance"), variant(""), variant(null)])).toEqual(allowed);
    });

    it("an empty cart", () => {
      expect(runWith([])).toEqual(allowed);
    });
  });

  it("returns exactly one cart-level error when blocking", () => {
    const [operation] = runWith([variant("Insurance"), variant("Insurance")]).operations;
    expect(operation.validationAdd.errors).toHaveLength(1);
    expect(operation.validationAdd.errors[0].target).toBe("$.cart");
  });
});
