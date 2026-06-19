import {
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";

import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { childContainers, lifecycleHistory } from "@/panel/utils/selectors";

import { History } from "./History";
import { Field, LinkButton, Section } from "./parts";

interface ContainerDetailProps {
  readonly container: DevtoolsContainerSnapshot;
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly actions: PanelActions;
}

/** Detail view for a selected container: links, contents (drill-in), history, cross-link. */
export function ContainerDetail({ container, roots, log, actions }: ContainerDetailProps) {
  const children: ReadonlyArray<DevtoolsContainerSnapshot> = childContainers(roots, container.containerId);
  const history: ReadonlyArray<DevtoolsEvent> = lifecycleHistory(log, container.containerId);

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
          container.bindings.map((binding) => (
            <div key={binding.token.name}>
              <LinkButton
                onClick={() =>
                  actions.select({ kind: "binding", containerId: container.containerId, token: binding.token.name })
                }
              >
                {binding.token.name}{" "}
                <span className={"text-fg-muted"}>
                  ({binding.type}/{binding.scope})
                </span>
              </LinkButton>
            </div>
          ))
        )}
      </Section>

      <Section title={`instances (${container.instances.length})`}>
        {container.instances.length === 0 ? (
          <span className={"text-fg-muted"}>—</span>
        ) : (
          container.instances.map((instance) => (
            <div key={instance.className}>
              <LinkButton
                onClick={() =>
                  actions.select({
                    kind: "instance",
                    containerId: container.containerId,
                    className: instance.className,
                  })
                }
              >
                {instance.className}
              </LinkButton>
            </div>
          ))
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
          onSelectInstance={(containerId, className) => actions.select({ kind: "instance", containerId, className })}
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
