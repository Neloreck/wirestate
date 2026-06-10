import type { Newable } from "./utils/class-like";

/**
 * Classes marked with `@Injectable()`, eligible for container instance bindings.
 */
const INJECTABLE_CLASSES: WeakSet<Newable<object>> = new WeakSet();

/**
 * Describes the decorator returned by {@link Injectable}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 */
export interface InjectableDecorator {
  // Standard (TC39):
  <T extends Newable<object>>(value: T, context: ClassDecoratorContext): void;
  // Legacy/experimental:
  <T extends Newable<object>>(value: T): void;
}

/**
 * Marks a class as eligible for container instance bindings.
 *
 * @remarks
 * The decorator is a validation marker: binding a class that is not decorated
 * fails fast at registration time. Dependencies are declared with `inject()`
 * in constructor parameter defaults or field initializers — no parameter
 * decorators are involved, so the same class compiles under legacy and TC39
 * standard decorators alike.
 *
 * @returns A class decorator registering the class as injectable.
 */
export function Injectable(): InjectableDecorator {
  return (<T extends Newable<object>>(value: T, context?: ClassDecoratorContext): void => {
    if (context && context.kind !== "class") {
      throw Error("@Injectable() can only decorate classes.");
    }

    INJECTABLE_CLASSES.add(value);
  }) as InjectableDecorator;
}

/**
 * Checks whether a class was marked with {@link Injectable}.
 *
 * @param target - Class to check.
 * @returns Whether the class is marked as injectable.
 */
export function isInjectable(target: Newable<object>): boolean {
  return INJECTABLE_CLASSES.has(target);
}
