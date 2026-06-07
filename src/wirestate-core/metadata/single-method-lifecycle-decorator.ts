import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { Maybe } from "../types/general";

import { getPrototypeChainMetadata } from "./prototype-chain";

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
  readonly decorator: () => MethodDecorator;

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
 * @param options - Registry, name, and message builders for the hook.
 * @returns The hook's decorator factory and metadata reader.
 */
export function createSingleMethodDecoratorDescriptor(
  options: SingleMethodDecoratorOptions
): SingleMethodDecoratorDescriptor {
  const { registry, name, duplicateMessage, hierarchyMessage } = options;

  return {
    decorator: (): MethodDecorator => {
      return (target, propertyKey) => {
        dbg.info(prefix(__filename), `Attaching ${name} metadata:`, {
          name: (target as object).constructor.name,
          propertyKey,
          target,
          constructor: (target as object).constructor,
        });

        const constructor: object = (target as object).constructor;

        if (registry.has(constructor)) {
          throw new WirestateError(
            duplicateMessage((constructor as { name: string }).name),
            ERROR_CODE_VALIDATION_ERROR
          );
        }

        registry.set(constructor, propertyKey);
      };
    },
    getMetadata: (instance: object): Maybe<string | symbol> => {
      dbg.info(prefix(__filename), `Resolving ${name} metadata:`, { name: instance.constructor.name, instance });

      let handler: Maybe<string | symbol> = null;

      for (const metadata of getPrototypeChainMetadata(instance, registry)) {
        if (handler && handler !== metadata) {
          throw new WirestateError(hierarchyMessage(instance.constructor.name), ERROR_CODE_VALIDATION_ERROR);
        }

        handler = metadata;
      }

      return handler;
    },
  };
}
