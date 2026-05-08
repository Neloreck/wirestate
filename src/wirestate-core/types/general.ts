// eslint-disable-next-line
export type TAnyObject = Record<string, any>;

export type Callable<T> = () => T;

export type Optional<T> = T | null;

export type Definable<T> = T | undefined;

export type MaybePromise<T> = T | Promise<T>;

export type Maybe<T> = T | null | undefined;
