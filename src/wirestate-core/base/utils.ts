// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Class<T> = new (...args: Array<any>) => T;

export interface AbstractClass<T> {
  prototype: T;
  name: string;
}

/**
 * Type-guard to assert if the given object is an (abstract) class.
 *
 * @param target
 * @internal
 */
export function isClassLike(target: unknown): target is Class<unknown> | AbstractClass<unknown> {
  return typeof target === "function";
}

/**
 * Returns all parent classes of a given class.
 *
 * @param target
 * @internal
 */
export function getParentClasses(target: Class<unknown>): Array<Class<unknown>> {
  const parentClasses: Array<Class<unknown>> = [];
  let currentClass = target;

  while (Object.getPrototypeOf(currentClass).name) {
    const parentClass: Class<unknown> = Object.getPrototypeOf(currentClass);

    parentClasses.push(parentClass);
    currentClass = parentClass;
  }

  return parentClasses;
}

/**
 * Ensures a given value is not null or undefined.
 *
 * @param value
 * @internal
 */
export function assertPresent<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw Error(`Expected value to be not null or undefined`);
  }

  return value;
}

/**
 * Creates slices of an array.
 *
 * @param array
 * @param step
 * @internal
 */
export function windowedSlice<T>(array: Array<T>, step?: 2): Array<[T, T]>;
export function windowedSlice<T>(array: Array<T>, step: number): Array<Array<T>>;
export function windowedSlice<T>(array: Array<T>, step = 2): Array<Array<T>> {
  const result: Array<Array<T>> = [];

  array.some((_, i) => {
    if (i + step > array.length) return true;

    result.push(array.slice(i, i + step));
  });

  return result;
}

/**
 * Assert that there is a single element in an array. Throws the error from error provider if not.
 *
 * @param array
 * @param errorProvider
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
 * @param _
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertNever(_: never): never {
  throw new Error("invalid state");
}
