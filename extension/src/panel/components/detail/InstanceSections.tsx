import {
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsInstance,
  type DevtoolsMethod,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";
import { useMemo } from "react";

import { type InspectFn } from "@/bridge/bridge.messages";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { lifecycleHistory, rootIdOfContainer, tokenOfInstanceId } from "@/panel/lib/selectors";
import { type Optional } from "@/types/general";

import { History } from "./History";
import { Field, Section, Tag } from "./parts";
import { StateTree, type ValueReader } from "./StateTree";

interface InstanceSectionsProps {
  readonly container: DevtoolsContainerSnapshot;
  readonly instance: DevtoolsInstance;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly inspect: InspectFn;
  readonly actions: PanelActions;
}

/**
 * The live-instance facet of a realized singleton `Instance` binding: status, declared handlers,
 * methods, on-demand state, and lifecycle history. Rendered inline by {@link BindingDetail} — selection
 * is binding/token-centric, so every cross-link resolves to the binding that realizes the instance.
 */
export function InstanceSections({ container, instance, log, roots, inspect, actions }: InstanceSectionsProps) {
  const history: ReadonlyArray<DevtoolsEvent> = lifecycleHistory(log, container.containerId, {
    instanceId: instance.instanceId,
    className: instance.className,
  });
  const status = instance.status;
  const rootId: Optional<number> = rootIdOfContainer(roots, container.containerId);

  // Memoized per (root, instance) so each state-tree node doesn't refetch on every parent re-render.
  const readState: Optional<ValueReader> = useMemo(
    () => (rootId === undefined ? undefined : (path) => inspect(rootId, instance.instanceId, path)),
    [inspect, rootId, instance.instanceId]
  );

  // Resolve an instance-anchored reference (lifecycle row, or a service field in the state tree) to
  // the binding that realizes it, then select that binding.
  const selectByInstanceId = (containerId: number, instanceId: number): void => {
    const token: Optional<string> = tokenOfInstanceId(roots, containerId, instanceId);

    if (token !== undefined) {
      actions.select({ kind: "binding", containerId, token });
    }
  };

  const methods: ReadonlyArray<DevtoolsMethod> = instance.methods ?? [];
  const handlerChannels: Map<string, Set<string>> = new Map();

  for (const handler of instance.handlers) {
    const channels: Set<string> = handlerChannels.get(handler.method) ?? new Set();

    channels.add(handler.channel);
    handlerChannels.set(handler.method, channels);
  }

  return (
    <>
      <Section title={"instance"}>
        <Field label={"class"}>{instance.className}</Field>
      </Section>

      <Section title={"provision"}>
        {status ? (
          <>
            <Field label={"state"}>
              <Tag tone={status.isDeprovisioned === null ? "neutral" : status.isDeprovisioned ? "warn" : "ok"}>
                {status.isDeprovisioned === null ? "not provisioned" : status.isDeprovisioned ? "deprovisioned" : "owned"}
              </Tag>
            </Field>
            <Field label={"provisionId"}>{status.provisionId ?? "—"}</Field>
          </>
        ) : (
          <span className={"text-fg-muted"}>untracked</span>
        )}
      </Section>

      <Section title={`declared handlers (${instance.handlers.length})`}>
        {instance.handlers.length === 0 ? (
          <span className={"text-fg-muted"}>—</span>
        ) : (
          instance.handlers.map((handler, index) => (
            <div key={index}>
              <Tag tone={"accent"} variant={"outline"}>
                {handler.channel}
              </Tag>{" "}
              {handler.type} → {handler.method}()
            </div>
          ))
        )}
      </Section>

      <Section title={`methods (${methods.length})`}>
        {methods.length === 0 ? (
          <span className={"text-fg-muted"}>—</span>
        ) : (
          methods.map((method) => {
            const channels: Optional<Set<string>> = handlerChannels.get(method.name);

            return (
              <div key={method.name} className={"flex flex-wrap items-center gap-1"}>
                <span>
                  {method.name}
                  <span className={"text-fg-muted"}>({method.arity})</span>
                </span>
                {channels
                  ? Array.from(channels).map((channel) => (
                      <Tag key={channel} tone={"accent"} variant={"outline"}>
                        {channel}
                      </Tag>
                    ))
                  : null}
              </div>
            );
          })
        )}
      </Section>

      <Section title={"state"}>
        <StateTree
          read={readState}
          rootLabel={"state"}
          onNavigate={(containerId, instanceId) => selectByInstanceId(containerId, instanceId)}
        />
      </Section>

      <Section title={"lifecycle history"}>
        <History
          events={history}
          onSelectBinding={(containerId, token) => actions.select({ kind: "binding", containerId, token })}
        />
      </Section>
    </>
  );
}
