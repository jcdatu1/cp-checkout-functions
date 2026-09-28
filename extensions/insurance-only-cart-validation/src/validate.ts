export const BLOCKED_PRODUCT_TYPE = "insurance";

export const ERROR_MESSAGE =
  "Your cart contains only shipping protection. Please add a product to continue.";

export const ERROR_TARGET = "$.cart";

export type CartLine = {
  merchandise: {
    __typename: string;
    product?: { productType?: string | null } | null;
  };
};

export type ValidationError = { message: string; target: string };

function isInsuranceLine(line: CartLine): boolean {
  const { merchandise } = line;
  if (merchandise.__typename !== "ProductVariant") return false;
  const productType = merchandise.product?.productType;
  return productType?.trim().toLowerCase() === BLOCKED_PRODUCT_TYPE;
}

export function validateCart(lines: CartLine[]): ValidationError[] {
  if (lines.length === 0 || !lines.every(isInsuranceLine)) return [];
  return [{ message: ERROR_MESSAGE, target: ERROR_TARGET }];
}
