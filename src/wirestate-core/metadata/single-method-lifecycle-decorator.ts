import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { Maybe } from "../types/general";

import { getPrototypeChainMetadata } from "./prototype-chain";
import { validateStandardMethodContext } from "./standard-decorator-context";

/**
 * Method decorator attached by single-method lifecycle hooks such as `@OnActivated`.
 *
 * @group Lifecycle
 */
export interface SingleMethodLifecycleDecorator {
  // Standard (TC39):
  <This>(value: (this: This, ...args: Array<never>) => unknown, context: ClassMethodDecoratorContext<This>): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

/**
 * Configuration for a single-method lifecycle decorator.
 *
 * @group Lifecycle
 * @internal
 */
export interface SingleMethodDecoratorOptions {
  /**
   * Registry that stores the decorated method name per constructor.
   */
  readonly registry: WeakMap<object, string | symbol>;

  /**
   * Standard decorator metadata key that stores the decorated method name on
   * the class `Symbol.metadata` object.
   *
   * @remarks
   * Required for TC39 standard decorator support.
   */
  readonly metadataKey?: symbol;

  /**
   * Decorator name used in diagnostics, for example `OnActivated`.
   */
  readonly name: string;

  /**
   * Builds the error message thrown when one class declares the hook twice.
   *
   * @param className - Name of the class that declared the duplicate hook.
   * @returns The error message.
   */
  readonly duplicateMessage: (className: string) => string;

  /**
   * Builds the error message thrown when a class hierarchy declares two
   * different methods for the same hook.
   *
   * @param className - Name of the instance class whose hierarchy is in conflict.
   * @returns The error message.
   */
  readonly hierarchyMessage: (className: string) => string;
}

/**
 * The decorator and metadata reader produced for one single-method lifecycle hook.
 *
 * @group Lifecycle
 * @internal
 */
export interface SingleMethodDecoratorDescriptor {
  /**
   * Method decorator factory that records the decorated method name.
   */
  readonly decorator: () => SingleMethodLifecycleDecorator;

  /**
   * Resolves the decorated method name for an instance, or `null` when none exists.
   */
  readonly getMetadata: (instance: object) => Maybe<string | symbol>;
}

/**
 * Builds a lifecycle hook that allows at most one decorated method per class hierarchy.
 *
 * @group Lifecycle
 * @internal
 *
 * @param options - Registry, metadata key, name, and message builders for the hook.
 * @returns The hook's decorator factory and metadata reader.
 */
export function createSingleMethodDecoratorDescriptor(
  options: SingleMethodDecoratorOptions
): SingleMethodDecoratorDescriptor {
  const { registry, metadataKey, name, duplicateMessage, hierarchyMessage } = options;

  return {
    decorator: (): SingleMethodLifecycleDecorator => {
      return ((target: object, nameOrContext: string | symbol | ClassMethodDecoratorContext): void => {
        if (typeof nameOrContext === "object") {
          // Standard decorators:
          const metadata: DecoratorMetadataObject = validateStandardMethodContext(name, nameOrContext);

          dbg.info(prefix(__filename), `Attaching ${name} metadata (TC39):`, {
            propertyKey: nameOrContext.name,
            context: nameOrContext,
          });

          if (metadataKey === undefined) {
            throw new WirestateError(
              `@${name}() is not configured for TC39 standard decorators: missing metadata key.`,
              ERROR_CODE_VALIDATION_ERROR
            );
          }

          // Own-key check: inherited keys come from base class metadata and stay allowed.
          if (Object.hasOwn(metadata, metadataKey)) {
            throw new WirestateError(
              `Only one @${name} method can be declared per class.`,
              ERROR_CODE_VALIDATION_ERROR
            );
          }

          metadata[metadataKey] = nameOrContext.name;
        } else {
          // Experimental legacy decorators:
          dbg.info(prefix(__filename), `Attaching ${name} metadata:`, {
            name: target.constructor.name,
            propertyKey: nameOrContext,
            target,
            constructor: target.constructor,
          });

          const constructor: object = target.constructor;

          if (registry.has(constructor)) {
            throw new WirestateError(
              duplicateMessage((constructor as { name: string }).name),
              ERROR_CODE_VALIDATION_ERROR
            );
          }

          registry.set(constructor, nameOrContext);
        }
      }) as SingleMethodLifecycleDecorator;
    },
    getMetadata: (instance: object): Maybe<string | symbol> => {
      dbg.info(prefix(__filename), `Resolving ${name} metadata:`, { name: instance.constructor.name, instance });

      let handler: Maybe<string | symbol> = null;

      for (const metadata of getPrototypeChainMetadata(instance, registry, metadataKey)) {
        if (handler && handler !== metadata) {
          throw new WirestateError(hierarchyMessage(instance.constructor.name), ERROR_CODE_VALIDATION_ERROR);
        }

        handler = metadata;
      }

      return handler;
    },
  };
}
