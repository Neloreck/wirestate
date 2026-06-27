import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { type Newable } from "../types/general";

/**
 * Classes marked with `@Injectable()`, eligible for container instance bindings.
 */
const INJECTABLE_CLASSES: WeakSet<Newable<object>> = new WeakSet();

/**
 * Describes the decorator returned by {@link Injectable}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @internal
 */
export interface InjectableDecorator {
  // Standard (TC39):
  <T extends Newable<object>>(value: T, context: ClassDecoratorContext): void;
  // Legacy/experimental:
  <T extends Newable<object>>(value: T): void;
}

/**
 * Marks a class as eligible for Wirestate instance bindings.
 *
 * @remarks
 * Instance bindings require the implementation class to be decorated with
 * `@Injectable()`. The mark is stored on the exact class. Subclasses must be
 * decorated separately when they are bound directly.
 *
 * The decorator supports both TC39 standard decorators and legacy TypeScript
 * decorators.
 *
 * @group Container
 *
 * @returns A class decorator registering the class as injectable.
 *
 * @throws {@link WirestateError} If the decorator is applied to a non-class TC39 target.
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
 * Checks whether a class was directly marked with {@link Injectable}.
 *
 * @remarks
 * The check does not walk the prototype chain. A subclass of an injectable
 * class returns `false` until that subclass is decorated too.
 *
 * @group Container
 *
 * @param target - Class to check.
 * @returns Whether the class is marked as injectable.
 */
export function isInjectable(target: Newable<object>): boolean {
  return INJECTABLE_CLASSES.has(target);
}
