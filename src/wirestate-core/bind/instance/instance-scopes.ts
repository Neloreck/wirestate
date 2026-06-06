import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container, Identifier, Newable } from "../../alias";
import { CommandBus } from "../../commands/command-bus";
import { WireScope } from "../../container/wire-scope";
import { ERROR_CODE_REFLECT_METADATA_MISSING } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";
import { EventBus } from "../../events/event-bus";
import { QueryBus } from "../../queries/query-bus";
import { SCOPES_BY_INSTANCE } from "../../registry";
import { Maybe, Optional } from "../../types/general";

interface ReflectWithMetadata {
  readonly getMetadata?: (metadataKey: string, target: object) => unknown;
}

/**
 * Describes options for {@link hasScopeInjection}.
 *
 * @internal
 */
export interface HasWireScopeInjectionOptions {
  /**
   * If true, missing reflect-metadata support throws a Wirestate error.
   *
   * @default false
   */
  readonly isRequired?: boolean;
}

/**
 * Checks whether target class constructor receives WireScope directly.
 *
 * @internal
 *
 * @param token - Constructor token to inspect.
 * @param options - Reflection behavior options.
 * @returns True when reflected constructor parameters include WireScope.
 */
export function hasScopeInjection(token: Identifier, options: HasWireScopeInjectionOptions = {}): boolean {
  if (typeof token !== "function") {
    return false;
  }

  const getMetadata = (Reflect as ReflectWithMetadata).getMetadata;

  if (!getMetadata) {
    if (options.isRequired) {
      throw new WirestateError(
        'reflect-metadata is required for Wirestate activation. Import "reflect-metadata" once at your application entry point before creating Wirestate containers.',
        ERROR_CODE_REFLECT_METADATA_MISSING
      );
    } else {
      return false;
    }
  }

  return Boolean(
    (getMetadata("design:paramtypes", token as object) as Maybe<Array<unknown>>)?.some((type) => type === WireScope)
  );
}

/**
 * Reads `design:paramtypes` from the constructor to find parameters typed as WireScope.
 * Property iteration happens only when the constructor metadata declares a WireScope
 * parameter, avoiding false positives from manually created or subclassed scopes.
 *
 * @internal
 *
 * @param instance - Target instance.
 * @param Constructor - Target constructor.
 */
export function attachScopes<T extends object>(instance: T, Constructor: Newable<T>): void {
  if (!hasScopeInjection(Constructor, { isRequired: true })) {
    dbg.info(prefix(__filename), "No scopes attached, skip attachment:", {
      instance,
      Constructor,
    });

    return;
  }

  const scopes: Array<WireScope> = [];

  for (const key of Object.getOwnPropertyNames(instance)) {
    const value = (instance as Record<string, unknown>)[key];

    if ((value as Optional<object>)?.constructor === WireScope) {
      scopes.push(value as WireScope);
    }
  }

  if (scopes.length > 0) {
    SCOPES_BY_INSTANCE.set(instance, scopes);
  }

  dbg.info(prefix(__filename), "Scopes attached:", {
    instance,
    Constructor,
    scopes,
    todoDelete: Object.getOwnPropertyNames(instance),
  });
}

/**
 * Marks all injected WireScope instances as disposed and removes the stored references.
 *
 * @internal
 *
 * @param instance - Target instance.
 */
export function detachScopes<T extends object>(instance: T): void {
  const scopes: Maybe<Array<WireScope>> = SCOPES_BY_INSTANCE.get(instance);

  if (!scopes) {
    return;
  }

  for (const scope of scopes) {
    (scope as { isDisposed: boolean }).isDisposed = true;
    (scope as { isDeprovisioned: boolean }).isDeprovisioned = true;
    (scope as unknown as { commandBus: Optional<CommandBus> }).commandBus = null;
    (scope as unknown as { container: Optional<Container> }).container = null;
    (scope as unknown as { eventBus: Optional<EventBus> }).eventBus = null;
    (scope as unknown as { queryBus: Optional<QueryBus> }).queryBus = null;
  }

  SCOPES_BY_INSTANCE.delete(instance);
}
