import {
  InjectableDescriptor,
  SeedEntries,
  WirestateError,
  getEntryToken,
  Newable,
  type ServiceIdentifier,
  applySeeds,
  bindEntry,
  unapplySeeds,
} from "@wirestate/core";
import { Container } from "inversify";
import {
  MutableRefObject,
  ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { IocContext, IocReactContext } from "../context/ioc-context";
import {
  ERROR_CODE_FAILED_REBIND_ATTEMPT,
  ERROR_CODE_INVALID_CONTEXT,
  ERROR_CODE_VALIDATION_ERROR,
} from "../error/error-code";
import { Optional } from "../types/general";

/**
 * Represents props for the component returned by {@link createInjectablesProvider}.
 *
 * @group Provision
 */
export interface InjectablesProviderProps {
  /**
   * Targeted seeds bound to specific injectables or tokens.
   *
   * @remarks
   * These seeds are applied before services are bound.
   * Subsequent prop changes are ignored. Use a React `key` on the provider
   * to force a re-mount and re-seed the subtree.
   */
  readonly seeds?: SeedEntries;
  /**
   * Subtree that consumes the bound services.
   */
  readonly children?: ReactNode;
}

/**
 * Component returned by {@link createInjectablesProvider}.
 *
 * @group Provision
 */
export type InjectablesProvider = ReturnType<typeof createInjectablesProvider>;

/**
 * Configuration for {@link createInjectablesProvider}.
 *
 * @group Provision
 */
export interface CreateInjectablesProviderOptions {
  /**
   * Services to resolve immediately when the provider mounts.
   *
   * @remarks
   * Listed services must also be present in the `entries` array.
   */
  readonly activate?: ReadonlyArray<ServiceIdentifier>;
}

/**
 * Creates a React component that manages the lifecycle of specified injectables for its subtree.
 *
 * @remarks
 * The returned component (an "Injectables Provider") binds services to the container
 * when it mounts and unbinds them when it unmounts. This allows for feature-scoped
 * or screen-scoped service lifecycles.
 *
 * It must be rendered within an {@link IocProvider}.
 *
 * @group Provision
 *
 * @param entries - Array of service classes or {@link InjectableDescriptor} objects to bind.
 * @param options - Configuration options for the provider.
 *
 * @returns A React component that provisions the specified services.
 *
 * @example
 * ```tsx
 * const InjectablesProvider = createInjectablesProvider(
 *   SomeService, { token: CONFIG_TOKEN, value: { enabled: true } }],
 *   { activate: [SomeService] }
 * );
 *
 * function Root() {
 *   return (
 *     <InjectablesProvider seeds={[[SomeService, { id: 123 }]]}>
 *       <RootPage />
 *     </InjectablesProvider>
 *   );
 * }
 * ```
 */
export function createInjectablesProvider(
  entries: ReadonlyArray<Newable<object> | InjectableDescriptor>,
  options: CreateInjectablesProviderOptions = {}
) {
  dbg.info(prefix(__filename), "Creating injectables provider:", { services: entries, options });

  const { activate } = options;

  if (activate && activate.length > 0) {
    const entryTokens: ReadonlyArray<ServiceIdentifier> = entries.map(getEntryToken);

    for (const eager of activate) {
      if (!entryTokens.includes(eager)) {
        throw new WirestateError(
          ERROR_CODE_VALIDATION_ERROR,
          `createInjectablesProvider: '${String(eager)}' is listed in 'activate' but was not provided in 'entries'.`
        );
      }
    }
  }

  function InjectablesProviderComponent(props: InjectablesProviderProps) {
    const iocContext: Optional<IocContext> = useContext(IocReactContext);

    if (!iocContext) {
      throw new WirestateError(
        ERROR_CODE_INVALID_CONTEXT,
        "<InjectablesProvider> must be rendered inside an <IocProvider> React subtree."
      );
    }

    const { container, revision } = iocContext;

    // Snapshot props on mount to ensure binding stability.
    // useState lazy initializer ensures it only runs once.
    const [initialPropsSnapshot] = useState<InjectablesProviderProps>(() => props);

    // When the parent container instance is replaced (e.g. HMR), migrate bindings to the new container.
    // Handle double effects in strict mode and prevent doubled store lifecycles.
    const previousContainerRef: MutableRefObject<Optional<Container>> = useRef(null);

    // Bind services synchronously so children can resolve them on their first render.
    // `entries` is stable (defined at module level), so this only runs once.
    // No need to do shallow checks here.
    useMemo(() => {
      if (previousContainerRef.current === container) {
        dbg.info(prefix(__filename), "Skip use-memo cached call:", {
          container: container,
          revision: revision,
          services: entries,
          initialPropsSnapshot,
          activate,
        });

        return;
      }

      dbg.info(prefix(__filename), "Providing services on first render:", {
        container: container,
        revision: revision,
        services: entries,
        initialPropsSnapshot,
        activate,
      });

      // Seed must be applied before binding so @Inject(INITIAL_STATE_TOKEN) works during activation.
      if (initialPropsSnapshot.seeds) {
        applySeeds(container, initialPropsSnapshot.seeds);
      }

      for (const entry of entries) {
        if (container.isBound(getEntryToken(entry))) {
          throw new WirestateError(
            ERROR_CODE_FAILED_REBIND_ATTEMPT,
            "Trying to rebind service that is already bound in the parent container. Your InjectablesProvider should not redefine services in the provider."
          );
        }

        bindEntry(container, entry);
      }

      if (activate) {
        for (const eager of activate) {
          container.get(eager);
        }
      }

      previousContainerRef.current = container;
    }, []);

    useEffect(() => {
      dbg.info(prefix(__filename), "Providing services on mount:", {
        container: container,
        revision: revision,
        entries,
        initialPropsSnapshot,
        activate,
      });

      let didRebind: boolean = false;

      // Re-apply state and re-bind if container was reset (e.g. StrictMode remount or HMR).
      if (initialPropsSnapshot.seeds) {
        applySeeds(container, initialPropsSnapshot.seeds);
      }

      for (const entry of entries) {
        if (!container.isBound(getEntryToken(entry))) {
          didRebind = true;
          bindEntry(container, entry);
        } else {
          dbg.info(prefix(__filename), "Skip binding of provider entry:", {
            entry,
            container: container,
            revision: revision,
          });
        }
      }

      if (activate) {
        for (const eager of activate) {
          container.get(eager);
        }
      }

      // Increment revision to invalidate stale injection caches.
      if (didRebind) {
        dbg.info(prefix(__filename), "Bump revision:", {
          container: container,
          from: revision,
          to: revision + 1,
        });

        iocContext.setRevision((revision) => revision + 1);
      }

      return () => {
        dbg.info(prefix(__filename), "Unprovision services on unmount:", {
          container: container,
          revision: revision,
          entries,
        });

        for (const entry of entries) {
          container.unbind(getEntryToken(entry));
        }

        // Remove only this provider's targeted initial state entries.
        if (initialPropsSnapshot.seeds) {
          unapplySeeds(container, initialPropsSnapshot.seeds);
        }
      };
    }, [container]);

    return props.children as ReactElement;
  }

  InjectablesProviderComponent.displayName = "InjectablesProvider";

  dbg.info(prefix(__filename), "Created injectables provider:", {
    InjectablesProviderComponent,
    entries,
    options,
  });

  return InjectablesProviderComponent;
}
