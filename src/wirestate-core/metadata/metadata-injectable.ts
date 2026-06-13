import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import type { Newable } from "../types/general";

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
 * @returns A class decorator registering the class as injectable.
 */
export function Injectable(): InjectableDecorator {
  return (<T extends Newable<object>>(value: T, context?: ClassDecoratorContext): void => {
    if (context && context.kind !== "class") {
      throw new WirestateError("@Injectable() can only decorate classes.", ERROR_CODE_INVALID_ARGUMENTS);
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
