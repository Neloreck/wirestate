import type { DevtoolsEvent } from "@wirestate/core/devtools";

/** Renders a derived lifecycle history (ordered, not timestamped — v1 lifecycle deltas carry no time). */
export function History({ events }: { events: ReadonlyArray<DevtoolsEvent> }) {
  if (events.length === 0) {
    return (
      <span className="text-neutral-500 dark:text-neutral-400">no recorded lifecycle (buffer may have rolled over)</span>
    );
  }

  return (
    <ol className="space-y-0.5">
      {events.map((event, index) => (
        <li key={index} className="text-neutral-600 dark:text-neutral-300">
          {index + 1}. {event.kind === "lifecycle" ? event.phase : event.kind}
        </li>
      ))}
    </ol>
  );
}
