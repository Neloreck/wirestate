import {
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsInstance,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";

import { type InspectFn } from "@/bridge/messages";
import { lifecycleHistory } from "@/panel/selectors";
import { type PanelActions } from "@/panel/use-panel-state";
import { type Optional } from "@/types/general";

import { History } from "./History";
import { Field, LinkButton, Section } from "./parts";
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
  const rootId: Optional<number> = roots.find((root) =>
    root.containers.some((entry) => entry.containerId === container.containerId)
  )?.rootId;

  return (
    <div className={"space-y-3"}>
      <Section title={"instance"}>
        <Field label={"class"}>{instance.className}</Field>
        <Field label={"token"}>
          {instance.token.name} <span className={"text-neutral-500"}>({instance.token.kind})</span>
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
          <span className={"text-neutral-500"}>untracked</span>
        )}
      </Section>

      <Section title={`declared handlers (${instance.handlers.length})`}>
        {instance.handlers.length === 0 ? (
          <span className={"text-neutral-500"}>none</span>
        ) : (
          instance.handlers.map((handler, index) => (
            <div key={index}>
              <span className={"text-fuchsia-600 dark:text-fuchsia-400"}>{handler.channel}</span> {handler.type} →{" "}
              {handler.method}()
            </div>
          ))
        )}
      </Section>

      <Section title={"lifecycle history"}>
        <History events={history} />
      </Section>

      <Section title={"state"}>
        <StateTree
          rootId={rootId}
          instanceId={instance.instanceId}
          inspect={inspect}
          onNavigate={(containerId, className) => actions.select({ kind: "instance", containerId, className })}
        />
      </Section>

      <div>
        <LinkButton onClick={() => actions.setContainerFilter(container.containerId)}>
          ⤵ Filter Timeline to this container
        </LinkButton>
      </div>
    </div>
  );
}
