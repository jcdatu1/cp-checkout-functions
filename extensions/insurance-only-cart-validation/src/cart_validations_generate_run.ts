import { validateCart, type CartLine, type ValidationError } from "./validate";

type Input = { cart: { lines: CartLine[] } };

type Output = { operations: { validationAdd: { errors: ValidationError[] } }[] };

export function cartValidationsGenerateRun(input: Input): Output {
  return { operations: [{ validationAdd: { errors: validateCart(input.cart.lines) } }] };
}
