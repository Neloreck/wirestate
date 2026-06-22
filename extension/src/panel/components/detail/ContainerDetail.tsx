import {
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";

import { Field, LinkButton, Section, Tag } from "@/panel/components/ui";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { BindingStatus, getBindingStatus, childContainers, getLifecycleHistory } from "@/panel/lib/selectors";

import { FilterToContainerLink } from "./FilterToContainerLink";
import { History } from "./History";
import { StatusTag } from "./StatusTag";

interface ContainerDetailProps {
  readonly container: DevtoolsContainerSnapshot;
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly actions: PanelActions;
}

/**
 * Detail view for a selected container: links, contents (drill-in), history, cross-link.
 */
export function ContainerDetail({ container, roots, log, actions }: ContainerDetailProps) {
  const children: ReadonlyArray<DevtoolsContainerSnapshot> = childContainers(roots, container.containerId);
  const history: ReadonlyArray<DevtoolsEvent> = getLifecycleHistory(log, container.containerId);

  return (
    <div className={"space-y-3"}>
      <Section title={"container"}>
        <Field label={"id"}>#{container.containerId}</Field>
        <Field label={"parent"}>
          {container.parentContainerId === null ? (
            "— (root)"
          ) : (
            <LinkButton
              onClick={() => actions.select({ kind: "container", containerId: container.parentContainerId as number })}
            >
              #{container.parentContainerId}
            </LinkButton>
          )}
        </Field>

        <Field label={"children"}>
          {children.length === 0
            ? "—"
            : children.map((child) => (
                <LinkButton
                  key={child.containerId}
                  onClick={() => actions.select({ kind: "container", containerId: child.containerId })}
                >
                  #{child.containerId}&nbsp;
                </LinkButton>
              ))}
        </Field>
      </Section>

      <Section title={`bindings (${container.bindings.length})`}>
        {container.bindings.length === 0 ? (
          <span className={"text-fg-muted"}>—</span>
        ) : (
          container.bindings.map((binding) => {
            const status: BindingStatus = getBindingStatus(container, binding);

            return (
              // Active is the common case (no tag); only the exceptions are flagged, and an inactive
              // binding's row dims so the live ones stand out.
              <div
                key={binding.token.name}
                className={`flex items-center gap-1 ${status === BindingStatus.Inactive ? "opacity-60" : ""}`}
              >
                <LinkButton
                  onClick={() =>
                    actions.select({ kind: "binding", containerId: container.containerId, token: binding.token.name })
                  }
                >
                  {binding.token.name}
                </LinkButton>

                <Tag tone={binding.type === "Value" ? "info" : binding.type === "Instance" ? "accent" : "warn"}>
                  {binding.type}
                </Tag>

                {binding.scope === "Transient" ? <Tag tone={"warn"}>Transient</Tag> : null}

                {status === BindingStatus.Inactive || status === BindingStatus.Unrealized ? (
                  <StatusTag status={status} />
                ) : null}
              </div>
            );
          })
        )}
      </Section>

      <Section title={`plugins (${container.plugins.length})`}>
        {container.plugins.length === 0 ? (
          <span className={"text-fg-muted"}>—</span>
        ) : (
          container.plugins.map((plugin) => (
            <div key={plugin.name}>
              <LinkButton
                onClick={() =>
                  actions.select({ kind: "plugin", containerId: container.containerId, name: plugin.name })
                }
              >
                {plugin.name}
              </LinkButton>
            </div>
          ))
        )}
      </Section>

      <Section title={"lifecycle history"}>
        <History
          events={history}
          onSelectBinding={(containerId, token) => actions.select({ kind: "binding", containerId, token })}
        />
      </Section>

      <FilterToContainerLink onClick={() => actions.setContainerFilter(container.containerId)} />
    </div>
  );
}
