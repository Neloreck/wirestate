import { useCallback, type MouseEvent } from "react";

import { type DevtoolsEvent, type DevtoolsInstance } from "#/devtools";

import { getDevtoolsEventSummary } from "@/panel/lib/format";
import { getLifecyclePhasePresentation } from "@/panel/lib/styling/phase";

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

  if (event.kind === "lifecycle") {
    const { className, glyph } = getLifecyclePhasePresentation(event.phase);

    const phase = (
      <span className={className}>
        {glyph} {event.phase}
      </span>
    );

    if (event.instance) {
      const instance: DevtoolsInstance = event.instance;

      return (
        <>
          {phase} ·{" "}
          <button
            className={"text-sky-600 hover:underline dark:text-sky-400"}
            type={"button"}
            title={`Select ${instance.className}`}
            onClick={onSelect}
          >
            {instance.className}
          </button>
        </>
      );
    }

    return phase;
  }

  return getDevtoolsEventSummary(event);
}
