import {
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsInstance,
  type DevtoolsMethod,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";

import { type InspectFn } from "@/bridge/bridge.messages";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { lifecycleHistory, rootIdOfContainer } from "@/panel/lib/selectors";
import { type Optional } from "@/types/general";

import { History } from "./History";
import { Field, FilterToContainerLink, Section } from "./parts";
import { StateTree } from "./StateTree";

interface InstanceDetailProps {
  readonly container: DevtoolsContainerSnapshot;
  readonly instance: DevtoolsInstance;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly actions: PanelActions;
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly inspect: InspectFn;
}

/** Detail view for a selected instance: status, declared handlers, history, and on-demand state. */
export function InstanceDetail({ container, instance, log, actions, roots, inspect }: InstanceDetailProps) {
  const history: ReadonlyArray<DevtoolsEvent> = lifecycleHistory(log, container.containerId, {
    instanceId: instance.instanceId,
    className: instance.className,
  });
  const status = instance.status;
  const rootId: Optional<number> = rootIdOfContainer(roots, container.containerId);

  // Older cores predate `methods`; treat absence as empty. Map each handler method to its channel(s)
  // so the methods list can badge the ones wired to the message stream.
  const methods: ReadonlyArray<DevtoolsMethod> = instance.methods ?? [];
  const handlerChannels: Map<string, Set<string>> = new Map();

  for (const handler of instance.handlers) {
    const channels: Set<string> = handlerChannels.get(handler.method) ?? new Set();

    channels.add(handler.channel);
    handlerChannels.set(handler.method, channels);
  }

  return (
    <div className={"space-y-3"}>
      <Section title={"instance"}>
        <Field label={"class"}>{instance.className}</Field>
        <Field label={"token"}>
          {instance.token.name} <span className={"text-fg-muted"}>({instance.token.kind})</span>
        </Field>
      </Section>

      <Section title={"status"}>
        {status ? (
          <>
            <Field label={"active"}>{status.isInactive ? "inactive" : "active"}</Field>
            <Field label={"provision"}>
              {status.isDeprovisioned === null ? "not provisioned" : status.isDeprovisioned ? "deprovisioned" : "owned"}
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
              <span className={"text-fuchsia-600 dark:text-fuchsia-400"}>{handler.channel}</span> {handler.type} →{" "}
              {handler.method}()
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
              <div key={method.name}>
                {method.name}
                <span className={"text-fg-muted"}>({method.arity})</span>
                {channels ? (
                  <span className={"text-fuchsia-600 dark:text-fuchsia-400"}> {Array.from(channels).join(", ")}</span>
                ) : null}
              </div>
            );
          })
        )}
      </Section>

      <Section title={"state"}>
        <StateTree
          rootId={rootId}
          instanceId={instance.instanceId}
          inspect={inspect}
          onNavigate={(containerId, className) => actions.select({ kind: "instance", containerId, className })}
        />
      </Section>

      <Section title={"lifecycle history"}>
        <History
          events={history}
          onSelectInstance={(containerId, className) => actions.select({ kind: "instance", containerId, className })}
        />
      </Section>
      <FilterToContainerLink onClick={() => actions.setContainerFilter(container.containerId)} />
    </div>
  );
}
