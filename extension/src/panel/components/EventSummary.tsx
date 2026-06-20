import { type DevtoolsEvent } from "@wirestate/core/devtools";

import { summarizeDevtoolsEvent } from "@/panel/lib/format";

interface EventSummaryProps {
  readonly event: DevtoolsEvent;
  /** Navigates to the instance a lifecycle delta is about (by container + class, the panel's key). */
  readonly onSelectInstance: (containerId: number, className: string) => void;
}

/**
 * A delta's one-line summary. For a lifecycle delta the class name is a link to the instance that
 * caused the event; other deltas render as plain {@link summarizeDevtoolsEvent} text.
 */
export function EventSummary({ event, onSelectInstance }: EventSummaryProps) {
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
            onSelectInstance(event.containerId, instance.className);
          }}
        >
          {instance.className}
        </button>
      </>
    );
  }

  return <>{summarizeDevtoolsEvent(event)}</>;
}
