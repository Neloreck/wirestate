import type { DevtoolsContainerSnapshot, DevtoolsEvent, DevtoolsInstance } from "@wirestate/core/devtools";

import { lifecycleHistory } from "@/panel/selectors";
import type { PanelActions } from "@/panel/use-panel-state";

import { History } from "./History";
import { Field, LinkButton, Section } from "./parts";

interface InstanceDetailProps {
  readonly container: DevtoolsContainerSnapshot;
  readonly instance: DevtoolsInstance;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly actions: PanelActions;
}

/** Detail view for a selected instance: status, declared handlers, history, and the state-gap placeholder. */
export function InstanceDetail({ container, instance, log, actions }: InstanceDetailProps) {
  const history: ReadonlyArray<DevtoolsEvent> = lifecycleHistory(log, container.containerId, instance.className);
  const status = instance.status;

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
        <div
          className={
            "rounded border border-dashed border-neutral-300 p-2 text-neutral-500 dark:border-neutral-600 dark:text-neutral-400"
          }
        >
          Not carried by protocol v1 (planned). The hook exposes structure, lifecycle, and messages — not an
          instance&#39;s field values.
        </div>
      </Section>

      <div>
        <LinkButton onClick={() => actions.setContainerFilter(container.containerId)}>
          ⤵ Filter Timeline to this container
        </LinkButton>
      </div>
    </div>
  );
}
