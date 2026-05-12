/**
 * Any object with string or symbol keys.
 *
 * @group Types
 */
// eslint-disable-next-line
export type AnyObject = Record<string | symbol, any>;

/**
 * Type that can be null.
 *
 * @group Types
 */
export type Optional<T> = T | null;

/**
 * Value or a promise of that value.
 *
 * @group Types
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Value that can be null or undefined.
 *
 * @group Types
 */
export type Maybe<T> = T | null | undefined;

/**
 * Helper to extract the interface of a type.
 *
 * @group Types
 */
export type Interface<T> = {
  [K in keyof T]: T[K];
};

/**
 * Return type for decorators.
 *
 * @group Types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DecoratorReturn = void | any;

/**
 * Ensures that a decorated field matches the type being provided.
 *
 * @group Types
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
