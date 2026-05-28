import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container, ServiceIdentifier } from "../alias";
import { bind } from "../bind/bind";
import { getBindingToken } from "../bind/get-binding-token";
import { setSeeds } from "../seeds/set-seeds";
import { SEED_TOKEN, SEEDS_TOKEN } from "../seeds/tokens";
import { AnyObject } from "../types/general";
import { SeedBindings, SeedsMap } from "../types/initial-state";
import { Bindings } from "../types/provision";

import { createBaseContainer } from "./create-base-container";
import { validateContainerConfig } from "./validate-container-config";
import { WireScope } from "./wire-scope";

/**
 * Services to resolve right after binding.
 *
 * `true` resolves every binding. An array resolves only those tokens. `false` or
 * `undefined` leaves services lazy.
 */
export type ContainerActivation = boolean | ReadonlyArray<ServiceIdentifier>;

/**
 * Represents options for {@link createContainer}.
 *
 * @group Container
 */
export interface CreateContainerOptions {
  /**
   * Bindings to resolve immediately after binding.
   */
  readonly activate?: ContainerActivation;

  /**
   * Services or binding descriptors to register.
   */
  readonly bindings?: Bindings;

  /**
   * Parent container for inherited bindings.
   */
  readonly parent?: Container;

  /**
   * Shared seed object. Read it with `scope.getSeed()` or inject `SEED`.
   */
  readonly seed?: AnyObject;

  /**
   * Seed values keyed by service class, string, or symbol.
   */
  readonly seeds?: SeedBindings;
}

/**
 * Represents reusable {@link createContainer} config.
 *
 * @remarks
 * Alias for {@link CreateContainerOptions}. Use it for provider configs stored
 * outside JSX or element code.
 *
 * @group Container
 */
export type ContainerConfig = CreateContainerOptions;

/**
 * Creates a Wirestate container.
 *
 * @remarks
 * This is an Inversify container with Wirestate pieces already installed:
 *
 * - Shared seed and targeted seed tokens.
 * - Container-scoped `EventBus`, `CommandBus`, and `QueryBus`.
 * - Transient `WireScope`, so each service gets its own scope handle.
 * - Singleton default scope for normal services.
 *
 * Child containers inherit parent bindings, but get their own buses and seeds.
 * Think of a child container like a nested workbench: it can borrow parent
 * tools, but it keeps its own inbox.
 *
 * @group Container
 *
 * @param options - Container setup.
 * @returns A new Wirestate-ready {@link Container}.
 *
 * @throws {@link WirestateError} If `activate` names a token missing from `bindings`.
 *
 * @example
 * ```typescript
 * import { Container, Injectable, createContainer } from "@wirestate/core";
 *
 * @Injectable()
 * class LoggerService {}
 *
 * @Injectable()
 * class CounterService {}
 *
 * const container: Container = createContainer({
 *   activate: [LoggerService],
 *   bindings: [CounterService, LoggerService],
 *   seeds: [[CounterService, { count: 10 }]],
 * });
 *
 * const logger = container.get(LoggerService);
 * ```
 */
export function createContainer(options: CreateContainerOptions = {}): Container {
  dbg.info(prefix(__filename), "Creating IOC container:", { options });

  validateContainerConfig(options);

  const activate: ReadonlyArray<ServiceIdentifier> =
    (options.activate === true ? options.bindings?.map(getBindingToken) : options.activate) || [];

  const container: Container = new Container({
    defaultScope: "Singleton",
    parent: createBaseContainer({ ...options, seeds: null, seed: null }),
  });

  container.bind(Container).toConstantValue(container);
  container.bind(SEEDS_TOKEN).toConstantValue(new Map() as SeedsMap);
  container.bind(SEED_TOKEN).toConstantValue(options.seed ?? {});

  if (options.seeds) {
    setSeeds(container, options.seeds);
  }

  container
    .bind(WireScope)
    .toResolvedValue((): WireScope => new WireScope(container))
    .inTransientScope();

  dbg.info(prefix(__filename), "Injecting bindings on creation:", { container, options });

  if (options.bindings) {
    for (const binding of options.bindings) {
      bind(container, binding);
    }
  }

  for (const binding of activate) {
    container.get(binding);
  }

  return container;
}
