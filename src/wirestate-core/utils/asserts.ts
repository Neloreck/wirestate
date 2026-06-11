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
