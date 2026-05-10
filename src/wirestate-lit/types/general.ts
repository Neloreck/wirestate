/**
 * Represents any object with string or symbol keys.
 *
 * @group types
 */
// eslint-disable-next-line
export type AnyObject = Record<string | symbol, any>;

/**
 * Represents a type that can be null.
 *
 * @group types
 */
export type Optional<T> = T | null;

/**
 * Represents a type that can be a value or a promise of that value.
 *
 * @group types
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Represents a type that can be null or undefined.
 *
 * @group types
 */
export type Maybe<T> = T | null | undefined;

/**
 * Helper to extract the interface of a type.
 *
 * @group types
 */
export type Interface<T> = {
  [K in keyof T]: T[K];
};

/**
 * Return type for decorators.
 *
 * @group types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DecoratorReturn = void | any;

/**
 * Type helper to ensure that a decorated field matches the type being provided.
 *
 * @group types
 */
export type FieldMustMatchProvidedType<Obj, Key extends PropertyKey, ProvidedType> =
  Obj extends Record<Key, infer ConsumingType>
    ? [ProvidedType] extends [ConsumingType]
      ? DecoratorReturn
      : {
          message: "provided type not assignable to consuming field";
          provided: ProvidedType;
          consuming: ConsumingType;
        }
    : Obj extends Partial<Record<Key, infer ConsumingType>>
      ? [ProvidedType] extends [ConsumingType | undefined]
        ? DecoratorReturn
        : {
            message: "provided type not assignable to consuming field";
            provided: ProvidedType;
            consuming: ConsumingType | undefined;
          }
      : DecoratorReturn;
