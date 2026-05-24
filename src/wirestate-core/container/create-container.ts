import { Container, Newable, ServiceIdentifier } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { bindEntry } from "../bind/bind-entry";
import { getEntryToken } from "../bind/get-entry-token";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { applySeeds } from "../seeds/apply-seeds";
import { SEED_TOKEN, SEEDS_TOKEN } from "../seeds/tokens";
import { AnyObject } from "../types/general";
import { SeedEntries, SeedsMap } from "../types/initial-state";
import { InjectableDescriptor } from "../types/provision";

import { createBaseContainer } from "./create-base-container";
import { WireScope } from "./wire-scope";

/**
 * Describes which services should be resolved immediately after entries are bound.
 */
export type ContainerActivation = boolean | ReadonlyArray<ServiceIdentifier>;

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
   * Pass an array to activate specific services. Listed services must also be
   * present in the `entries` array. Pass `true` to activate all provided entries.
   */
  readonly activate?: ContainerActivation;
}

/**
 * Represents configuration object accepted by {@link createContainer}.
 *
 * @remarks
 * Alias for {@link CreateContainerOptions}. Prefer this name when storing or
 * passing reusable container configuration values.
 *
 * @group Container
 */
export type ContainerConfig = CreateContainerOptions;

/**
 * Creates an Inversify {@link Container} pre-configured with Wirestate essentials.
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
 * const container: Container = createContainer({
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
 *
 * @example
 * ```typescript
 * const container: Container = createContainer({
 *   entries: [CounterService, LoggerService],
 *   activate: true
 * });
 *
 * bindService(container, MyService);
 * ```
 */
export function createContainer(options: CreateContainerOptions = {}): Container {
  dbg.info(prefix(__filename), "Creating IOC container:", { options });

  const activate: ReadonlyArray<ServiceIdentifier> =
    (options.activate === true ? options.entries?.map(getEntryToken) : options.activate) || [];

  if (activate.length) {
    if (!options.entries?.length) {
      throw new WirestateError(
        ERROR_CODE_VALIDATION_ERROR,
        "Supplied activation list while entries for binding are not provided."
      );
    }

    const entryTokens: ReadonlyArray<ServiceIdentifier> = options.entries.map(getEntryToken);

    for (const eager of activate) {
      if (!entryTokens.includes(eager)) {
        throw new WirestateError(
          ERROR_CODE_VALIDATION_ERROR,
          `createContainer: '${String(eager)}' is listed in 'activate' but was not provided in 'entries'.`
        );
      }
    }
  }

  const container: Container = new Container({
    defaultScope: "Singleton",
    parent: createBaseContainer({ ...options, seeds: null, seed: null }),
  });

  container.bind(Container).toConstantValue(container);
  container.bind(SEEDS_TOKEN).toConstantValue(new Map() as SeedsMap);
  container.bind(SEED_TOKEN).toConstantValue(options.seed ?? {});

  if (options.seeds) {
    applySeeds(container, options.seeds);
  }

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

  for (const entry of activate) {
    container.get(entry);
  }

  return container;
}
