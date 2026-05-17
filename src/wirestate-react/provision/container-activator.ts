import { Container, ServiceIdentifier } from "@wirestate/core";
import { MutableRefObject, ReactElement, ReactNode, useRef } from "react";

import { useContainer } from "../context/use-container";
import { Optional } from "../types/general";

/**
 * Represents props for {@link ContainerActivator}.
 *
 * @group Provision
 */
export interface ContainerActivatorProps {
  /**
   * Services to resolve immediately on render.
   *
   * @remarks
   * Listed services must be bound in current container.
   */
  readonly activate: ReadonlyArray<ServiceIdentifier>;

  /**
   * Nested child node.
   */
  readonly children?: ReactNode;
}

/**
 * Resolves specified services from the current IoC container before rendering children.
 *
 * @remarks
 * Activation runs once per container instance.
 * On rerender with the same container, services are not resolved again.
 *
 * @group Provision
 *
 * @param props - Component properties.
 * @param props.activate - Services to resolve eagerly from container.
 * @param props.children - React children element.
 * @returns React children after activation side effect is applied.
 */
export function ContainerActivator(props: ContainerActivatorProps) {
  const container: Container = useContainer();
  const activatedContainerRef: MutableRefObject<Optional<Container>> = useRef(null);

  if (activatedContainerRef.current !== container) {
    activatedContainerRef.current = container;

    for (const entry of props.activate) {
      container.get(entry);
    }
  }

  return (props.children as ReactElement) ?? null;
}
