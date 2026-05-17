import { createBaseContainer } from "@wirestate/core/container/create-base-container";
import { WireScope } from "@wirestate/core/container/wire-scope";
import { Container, Newable, ServiceIdentifier } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { bindEntry } from "../bind/bind-entry";
import { getEntryToken } from "../bind/get-entry-token";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { AnyObject } from "../types/general";
import { SeedEntries } from "../types/initial-state";
import { InjectableDescriptor } from "../types/privision";

/**
 * Represents configuration options for {@link createContainer}.
 *
 * @group Container
 */
export interface CreateContainerOptions {
  /**
   * Optional parent container.
   * Enables hierarchical resolution and sharing of bindings.
   */
  readonly parent?: Container;

  /**
   * Initial data for the root seed.
   * Accessible via {@link WireScope.getSeed}() in services.
   */
  readonly seed?: AnyObject;

  /**
   * Targeted seeds bound to specific injectables or tokens.
   */
  readonly seeds?: SeedEntries;

  /**
   * Injectables to be bound to the container.
   *
   * @remarks
   * Supports class constructors and {@link InjectableDescriptor} configurations.
   */
  readonly entries?: ReadonlyArray<Newable<object> | InjectableDescriptor>;

  /**
   * Services to resolve immediately.
   *
   * @remarks
   * Listed services must also be present in the `entries` array.
   */
  readonly activate?: ReadonlyArray<ServiceIdentifier>;
}

/**
 * Creates an Inversify IoC container pre-configured with Wirestate essentials.
 *
 * @remarks
 * The container is initialized with:
 * - State management tokens: `SEEDS_TOKEN` and `SEED_TOKEN`.
 * - Messaging buses: {@link EventBus}, {@link QueryBus}, {@link CommandBus}.
 * - Service bridge: {@link WireScope} (bound in transient scope).
 * - Default scope set to `Singleton`.
 *
 * @group Container
 *
 * @param options - {@link CreateContainerOptions} configuration.
 * @returns A new Inversify {@link Container} instance.
 *
 * @example
 * ```typescript
 * const container: Container = createIocContainer({
 *   seeds: [
 *     [CounterService, { count: 1000 }],
 *     ["SOME_KEY", "VALUE"],
 *   ],
 *   entries: [CounterService, LoggerService],
 *   activate: [LoggerService]
 * });
 *
 * bindService(container, MyService);
 * ```
 */
export function createContainer(options: CreateContainerOptions = {}): Container {
  dbg.info(prefix(__filename), "Creating IOC container:", { options });

  if (options.activate && options.activate.length) {
    if (!options.entries?.length) {
      throw new WirestateError(
        ERROR_CODE_VALIDATION_ERROR,
        "Supplied activation list while entries for binding are not provided."
      );
    }

    const entryTokens: ReadonlyArray<ServiceIdentifier> = options.entries.map(getEntryToken);

    for (const eager of options.activate) {
      if (!entryTokens.includes(eager)) {
        throw new WirestateError(
          ERROR_CODE_VALIDATION_ERROR,
          `createInjectablesProvider: '${String(eager)}' is listed in 'activate' but was not provided in 'entries'.`
        );
      }
    }
  }

  const container: Container = new Container({
    defaultScope: "Singleton",
    parent: createBaseContainer(options),
  });

  container
    .bind(WireScope)
    .toResolvedValue((): WireScope => new WireScope(container))
    .inTransientScope();

  dbg.info(prefix(__filename), "Injecting entries on creation:", { container, options });

  if (options.entries) {
    for (const entry of options.entries) {
      bindEntry(container, entry);
    }
  }

  if (options.activate) {
    for (const entry of options.activate) {
      container.get(entry);
    }
  }

  return container;
}
