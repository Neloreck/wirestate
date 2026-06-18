import { type DevtoolsMessageChannel } from "@wirestate/core/devtools";

import { type RootModel } from "@/panel/selectors";
import { type EventKind, type TimelineFilter } from "@/panel/types";
import { type PanelActions, type PanelUi } from "@/panel/use-panel-state";

const KINDS: ReadonlyArray<EventKind> = ["lifecycle", "message", "registration"];
const CHANNELS: ReadonlyArray<DevtoolsMessageChannel> = ["event", "command", "query"];

interface TimelineFiltersProps {
  readonly roots: ReadonlyArray<RootModel>;
  readonly containerIds: ReadonlyArray<number>;
  readonly filter: TimelineFilter;
  readonly ui: PanelUi;
  readonly actions: PanelActions;
  readonly onClear: () => void;
}

/** The Timeline's filter + control bar. */
export function TimelineFilters({ roots, containerIds, filter, ui, actions, onClear }: TimelineFiltersProps) {
  return (
    <div
      className={
        "flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-2.5 py-1 dark:border-neutral-700 dark:bg-neutral-800"
      }
    >
      <select
        className={"rounded border border-neutral-300 bg-white px-1 py-0.5 dark:border-neutral-600 dark:bg-neutral-900"}
        value={filter.rootId ?? ""}
        onChange={(event) => actions.setRootFilter(event.target.value === "" ? undefined : Number(event.target.value))}
      >
        <option value={""}>all roots</option>
        {roots.map((root) => (
          <option key={root.rootId} value={root.rootId}>
            {root.label}
          </option>
        ))}
      </select>

      <select
        className={"rounded border border-neutral-300 bg-white px-1 py-0.5 dark:border-neutral-600 dark:bg-neutral-900"}
        value={filter.containerId ?? ""}
        onChange={(event) =>
          actions.setContainerFilter(event.target.value === "" ? undefined : Number(event.target.value))
        }
      >
        <option value={""}>all containers</option>
        {containerIds.map((id) => (
          <option key={id} value={id}>
            container #{id}
          </option>
        ))}
      </select>

      {KINDS.map((kind) => (
        <label
          key={kind}
          className={"inline-flex cursor-pointer items-center gap-1 text-neutral-500 dark:text-neutral-400"}
        >
          <input type={"checkbox"} checked={filter.kinds[kind]} onChange={() => actions.toggleKind(kind)} />
          {kind}
        </label>
      ))}

      <span className={"text-neutral-300 dark:text-neutral-600"}>|</span>

      {CHANNELS.map((channel) => (
        <label
          key={channel}
          className={"inline-flex cursor-pointer items-center gap-1 text-neutral-500 dark:text-neutral-400"}
        >
          <input type={"checkbox"} checked={filter.channels[channel]} onChange={() => actions.toggleChannel(channel)} />
          {channel}
        </label>
      ))}

      <input
        className={
          "rounded border border-neutral-300 bg-white px-1.5 py-0.5 dark:border-neutral-600 dark:bg-neutral-900"
        }
        placeholder={"filter…"}
        value={filter.text}
        onChange={(event) => actions.setText(event.target.value)}
      />

      <span className={"flex-1"} />

      <Toggle on={ui.paused} label={ui.paused ? "paused" : "live"} onClick={actions.togglePaused} />
      <Toggle on={ui.autoscroll} label={"autoscroll"} onClick={actions.toggleAutoscroll} />
      <button
        type={"button"}
        onClick={onClear}
        className={
          "rounded border border-neutral-300 px-2 py-0.5 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-700"
        }
      >
        clear
      </button>
    </div>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type={"button"}
      onClick={onClick}
      className={`rounded border px-2 py-0.5 ${
        on
          ? "border-emerald-400 text-emerald-600 dark:text-emerald-400"
          : "border-neutral-300 text-neutral-500 dark:border-neutral-600 dark:text-neutral-400"
      }`}
    >
      {label}
    </button>
  );
}
