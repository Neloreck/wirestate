import { Identifier } from "@wirestate/core";

import { AnyObject, Maybe } from "../types/general";

/**
 * Checks whether two objects are shallowly equal.
 *
 * @remarks
 * Objects are considered equal when they have the same enumerable string keys
 * and each value is strictly equal (`===`).
 *
 * @group Utils
 * @internal
 *
 * @param left - First object to compare.
 * @param right - Second object to compare.
 * @returns `true` when objects are shallowly equal, otherwise `false`.
 */
export function shallowEqualObjects(left: Maybe<AnyObject>, right: Maybe<AnyObject>): boolean {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  const leftKeys: Array<string> = Object.keys(left);
  const rightKeys: Array<string> = Object.keys(right);
  const length: number = leftKeys.length;

  if (rightKeys.length !== length) {
    return false;
  }

  for (let index: number = 0; index < length; index++) {
    const key: string = leftKeys[index];

    if (left[key] !== right[key] || !Object.prototype.hasOwnProperty.call(right, key)) {
      return false;
    }
  }

  return true;
}

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

/**
 * Checks whether two container activation options are shallowly equal.
 *
 * @remarks
 * Boolean activation values are compared by identity. Activation arrays are
 * compared by item identity.
 *
 * @group Utils
 * @internal
 *
 * @param left - First activation option to compare.
 * @param right - Second activation option to compare.
 * @returns `true` when activation options are shallowly equal, otherwise `false`.
 */
export function shallowEqualActivation(
  left: Maybe<boolean | ReadonlyArray<Identifier>>,
  right: Maybe<boolean | ReadonlyArray<Identifier>>
): boolean {
  return left === right || (Array.isArray(left) && Array.isArray(right) && shallowEqualArrays(left, right));
}
