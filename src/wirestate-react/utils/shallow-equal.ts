import { type Maybe } from "../types/general";

/**
 * Checks whether two arrays are shallowly equal.
 *
 * @remarks
 * Arrays are considered equal when they have the same length and each item at
 * the same index is strictly equal (`===`).
 *
 * @group Utils
 * @internal
 *
 * @param left - First array to compare.
 * @param right - Second array to compare.
 * @returns `true` when arrays are shallowly equal, otherwise `false`.
 */
export function shallowEqualArrays<T>(left: Maybe<ReadonlyArray<T>>, right: Maybe<ReadonlyArray<T>>): boolean {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  const length: number = left.length;

  if (right.length !== length) {
    return false;
  }

  for (let index: number = 0; index < length; index++) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}
