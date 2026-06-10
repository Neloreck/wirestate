import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { Newable } from "../alias";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

/**
 * Classes marked with `@Injectable()`, eligible for container class bindings.
 */
const INJECTABLE_CLASSES: WeakSet<Newable<object>> = new WeakSet();

/**
 * Describes the decorator returned by {@link Injectable}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Bind
 */
export interface InjectableDecorator {
  // Standard (TC39):
  <T extends Newable<object>>(value: T, context: ClassDecoratorContext): void;
  // Legacy/experimental:
  <T extends Newable<object>>(value: T): void;
}

/**
 * Marks a class as a Wirestate service eligible for class bindings.
 *
 * @remarks
 * The decorator is a validation marker: binding a class that is not decorated
 * fails fast at registration time. Dependencies are declared with `inject()`
 * in constructor parameter defaults or field initializers — no parameter
 * decorators are involved, so the same class compiles under legacy and TC39
 * standard decorators alike.
 *
 * @group Bind
 *
 * @returns A class decorator registering the class as injectable.
 *
 * @example
 * ```typescript
 * import { Injectable, WireScope, inject } from "@wirestate/core";
 *
 * @Injectable()
 * class CartService {
 *   public constructor(private readonly scope: WireScope = inject(WireScope)) {}
 * }
 * ```
 */
export function Injectable(): InjectableDecorator {
  return (<T extends Newable<object>>(value: T, context?: ClassDecoratorContext): void => {
    if (context && context.kind !== "class") {
      throw new WirestateError("@Injectable() can only decorate classes.", ERROR_CODE_VALIDATION_ERROR);
    }

    dbg.info(prefix(__filename), "Marking class as injectable:", { name: value.name, value });

    INJECTABLE_CLASSES.add(value);
  }) as InjectableDecorator;
}

/**
 * Checks whether a class was marked with {@link Injectable}.
 *
 * @group Bind
 *
 * @param target - Class to check.
 * @returns Whether the class is marked as injectable.
 */
export function isInjectable(target: Newable<object>): boolean {
  return INJECTABLE_CLASSES.has(target);
}
