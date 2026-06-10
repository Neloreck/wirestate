/**
 * Ensures a given value is not null or undefined.
 *
 * @param value - Value to check.
 * @returns The value when it is present.
 * @internal
 */
export function assertPresent<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw Error(`Expected value to be not null or undefined`);
  }

  return value;
}

/**
 * Asserts that there is a single element in an array.
 *
 * @param array - Array expected to hold exactly one element.
 * @param errorProvider - Builds the error thrown when the array is empty or holds more than one element.
 * @returns The single element.
 * @internal
 */
export function assertSingle<T>(array: Array<T>, errorProvider: () => unknown): T {
  if (array.length > 1) {
    throw errorProvider();
  }

  const first = array.at(0);

  if (first === undefined) {
    throw errorProvider();
  }

  return first;
}

/**
 * Type-guard for `never` types, can be used to create exhaustive branches.
 *
 * @param _ - Value that should be unreachable.
 * @returns Never returns; always throws.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertNever(_: never): never {
  throw new Error("invalid state");
}
