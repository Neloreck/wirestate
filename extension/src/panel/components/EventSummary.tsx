import { type DevtoolsEvent, type DevtoolsInstance } from "@wirestate/core/devtools";
import { useCallback, type MouseEvent } from "react";

import { getDevtoolsEventSummary } from "@/panel/lib/format";

interface EventSummaryProps {
  readonly event: DevtoolsEvent;
  readonly onSelectBinding: (containerId: number, token: string) => void;
}

export function EventSummary({ event, onSelectBinding }: EventSummaryProps) {
  const onSelect = useCallback(
    (domEvent: MouseEvent<HTMLButtonElement>) => {
      domEvent.stopPropagation();

      if (event.kind === "lifecycle" && event.instance) {
        onSelectBinding(event.containerId, event.instance.token.name);
      }
    },
    [event, onSelectBinding]
  );

  if (event.kind === "lifecycle" && event.instance) {
    const instance: DevtoolsInstance = event.instance;

    return (
      <>
        {event.phase} ·{" "}
        <button
          type={"button"}
          title={`Select ${instance.className}`}
          className={"text-sky-600 hover:underline dark:text-sky-400"}
          onClick={onSelect}
        >
          {instance.className}
        </button>
      </>
    );
  }

  return getDevtoolsEventSummary(event);
}
