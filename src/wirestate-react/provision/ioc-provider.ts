import { Container } from "@wirestate/core";
import { createElement, ReactNode, useMemo, useState } from "react";

import { IocReactContext } from "../context/ioc-context";

/**
 * Props for {@link IocProvider}.
 *
 * @group Provision
 */
export interface IocProviderProps {
  /**
   * Inversify container instance to provide.
   */
  readonly container: Container;

  /**
   * Nested child node.
   */
  readonly children?: ReactNode;
}

/**
 * Provides an Inversify IoC container to the React component tree.
 *
 * @remarks
 * This component should be placed near the root of your application. It initializes
 * the IocReactContext, which is consumed by hooks like `useInjection` and `useContainer`.
 *
 * @group Provision
 *
 * @param props - Component properties.
 * @param props.container - External Inversify container instance.
 * @param props.seed - Shared seed data to be applied to the container.
 * @param props.children - React children element.
 * @returns A React Context Provider element.
 *
 * @example
 * ```tsx
 * const container: Container = createIocContainer({
 *   seeds: [
 *     [CounterService, { count: 1000 }],
 *     ["SOME_KEY", "VALUE"],
 *   ],
 *   entries: [CounterService, LoggerService],
 *   activate: [LoggerService]
 * });
 *
 * function Application() {
 *   return (
 *     <IocProvider container={container}>
 *       <HomePage />
 *     </IocProvider>
 *   );
 * }
 * ```
 */
export function IocProvider(props: IocProviderProps) {
  const [revision, setRevision] = useState<number>(1);
  const value = useMemo(
    () => ({ value: { container: props.container, revision, setRevision } }),
    [props.container, revision]
  );

  return createElement(IocReactContext.Provider, value, props.children);
}
