import { type DevtoolsEvent } from "@wirestate/core/devtools";

import { summarizeDevtoolsEvent } from "@/panel/lib/format";

interface EventSummaryProps {
  readonly event: DevtoolsEvent;
  /** Navigates to the binding that realizes the instance a lifecycle delta is about (by container + token). */
  readonly onSelectBinding: (containerId: number, token: string) => void;
}

/**
 * A delta's one-line summary. For a lifecycle delta the class name links to the binding that realizes
 * the instance that caused the event; other deltas render as plain {@link summarizeDevtoolsEvent} text.
 */
export function EventSummary({ event, onSelectBinding }: EventSummaryProps) {
  if (event.kind === "lifecycle" && event.instance) {
    const instance = event.instance;

    return (
      <>
        {event.phase} ·{" "}
        <button
          type={"button"}
          title={`Select ${instance.className}`}
          className={"text-sky-600 hover:underline dark:text-sky-400"}
          onClick={(domEvent) => {
            domEvent.stopPropagation();
            onSelectBinding(event.containerId, instance.token.name);
          }}
        >
          {instance.className}
        </button>
      </>
    );
  }

  return <>{summarizeDevtoolsEvent(event)}</>;
}
