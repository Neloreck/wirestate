/**
 * @group general-types
 */
// eslint-disable-next-line
export type AnyObject = Record<string | symbol, any>;

/**
 * @group general-types
 */
export type Optional<T> = T | null;

/**
 * @group general-types
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * @group general-types
 */
export type Maybe<T> = T | null | undefined;

/**
 * @group general-types
 */
export type Interface<T> = {
  [K in keyof T]: T[K];
};

/**
 * @group general-types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DecoratorReturn = void | any;

/**
 * @group general-types
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
