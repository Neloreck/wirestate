/**
 * Checks whether two arrays are shallowly equal.
 *
 * @remarks
 * Arrays are considered equal when they have the same length and each item
 * at the same index is strictly equal (`===`).
 *
 * @group Utils
 * @internal
 *
 * @param left - First array to compare.
 * @param right - Second array to compare.
 * @returns `true` when arrays are shallowly equal, otherwise `false`.
 */
export function shallowEqualArrays(left: ReadonlyArray<unknown>, right: ReadonlyArray<unknown>) {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < right.length; i++) {
    if (left[i] !== right[i]) {
      return false;
    }
  }

  return true;
}
