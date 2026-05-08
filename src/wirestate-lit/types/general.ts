// eslint-disable-next-line
export type AnyObject = Record<string, any>;

export type Optional<T> = T | null;

export type MaybePromise<T> = T | Promise<T>;

export type Maybe<T> = T | null | undefined;

export type Interface<T> = {
  [K in keyof T]: T[K];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DecoratorReturn = void | any;

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
