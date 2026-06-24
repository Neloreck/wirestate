import { type DevtoolsMessageChannel } from "@wirestate/core/devtools";
import { type ChangeEvent, useCallback } from "react";

import { type EventKind, type PanelActions, type PanelUi, type TimelineFilter } from "@/panel/hooks/use-panel-state";
import { type RootModel } from "@/panel/lib/selectors";

import { TimelineToggle } from "./TimelineToggle";

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

/**
 * The Timeline's filter + control bar.
 */
export function TimelineFilters({ roots, containerIds, filter, ui, actions, onClear }: TimelineFiltersProps) {
  const onSetRootFilter = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      actions.setRootFilter(event.target.value === "" ? undefined : Number(event.target.value));
    },
    [actions]
  );

  const onSetContainerFilter = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      actions.setContainerFilter(event.target.value === "" ? undefined : Number(event.target.value));
    },
    [actions]
  );

  const onChangeFilter = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => actions.setText(event.target.value),
    [actions]
  );

  return (
    <div className={"flex flex-wrap items-center gap-2 border-b border-divider bg-elevated px-2.5 py-1"}>
      <select
        className={"rounded border border-divider bg-surface px-1 py-0.5"}
        value={filter.rootId ?? ""}
        onChange={onSetRootFilter}
      >
        <option value={""}>all roots</option>

        {roots.map((root) => (
          <option key={root.rootId} value={root.rootId}>
            {root.label}
          </option>
        ))}
      </select>

      <select
        className={"rounded border border-divider bg-surface px-1 py-0.5"}
        value={filter.containerId ?? ""}
        onChange={onSetContainerFilter}
      >
        <option value={""}>all containers</option>

        {containerIds.map((id) => (
          <option key={id} value={id}>
            container #{id}
          </option>
        ))}
      </select>

      {KINDS.map((kind) => (
        <label key={kind} className={"inline-flex cursor-pointer items-center gap-1 text-fg-muted"}>
          <input type={"checkbox"} checked={filter.kinds[kind]} onChange={() => actions.toggleKind(kind)} />
          {kind}
        </label>
      ))}

      <span className={"text-fg-subtle"}>|</span>

      {CHANNELS.map((channel) => (
        <label key={channel} className={"inline-flex cursor-pointer items-center gap-1 text-fg-muted"}>
          <input type={"checkbox"} checked={filter.channels[channel]} onChange={() => actions.toggleChannel(channel)} />
          {channel}
        </label>
      ))}

      <input
        className={"rounded border border-divider bg-surface px-1.5 py-0.5"}
        placeholder={"filter…"}
        value={filter.text}
        onChange={onChangeFilter}
      />

      <span className={"flex-1"} />

      <TimelineToggle active={ui.paused} label={ui.paused ? "paused" : "live"} onClick={actions.togglePaused} />

      <TimelineToggle active={ui.autoscroll} label={"autoscroll"} onClick={actions.toggleAutoscroll} />

      <button className={"rounded border border-divider px-2 py-0.5 hover:bg-hover"} type={"button"} onClick={onClear}>
        clear
      </button>
    </div>
  );
}
