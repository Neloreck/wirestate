import "@/components/lit/lit-root";

import { type Container } from "@wirestate/core";
import { useContainer } from "@wirestate/react";
import { useCallback } from "react";

export function LitRoot() {
  const container: Container = useContainer();

  const bindContainer = useCallback(
    (element: HTMLElement | null) => {
      if (element) {
        (element as HTMLElement & { container?: Container }).container = container;
      }
    },
    [container],
  );

  return <w-lit-root ref={bindContainer}></w-lit-root>;
}
