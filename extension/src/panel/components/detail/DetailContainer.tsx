import { BindingScope, BindingType } from "@wirestate/core";
import {
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";
import { History, Link, Puzzle } from "lucide-react";
import { useCallback } from "react";

import { cn } from "@/lib/class-name";
import { Field, LinkButton, Section, Tag } from "@/panel/components/ui";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { BindingStatus, getBindingStatus } from "@/panel/lib/binding";
import { childContainers } from "@/panel/lib/container-tree";
import { getLifecycleHistory } from "@/panel/lib/deltas";

import { DetailHistory } from "./DetailHistory";
import { DetailStatusTag } from "./DetailStatusTag";

interface DetailContainerProps {
  readonly container: DevtoolsContainerSnapshot;
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly actions: PanelActions;
}

/**
 * Detail view for a selected container: links, contents (drill-in), history, cross-link.
 */
export function DetailContainer({ container, roots, log, actions }: DetailContainerProps) {
  const children: ReadonlyArray<DevtoolsContainerSnapshot> = childContainers(roots, container.containerId);
  const history: ReadonlyArray<DevtoolsEvent> = getLifecycleHistory(log, container.containerId);

  const onSelectParentContainer = useCallback(() => {
    actions.select({ kind: "container", containerId: container.parentContainerId as number });
  }, [actions, container.parentContainerId]);

  const onSelectBinding = useCallback(
    (containerId: number, token: string) => actions.select({ kind: "binding", containerId, token }),
    [actions]
  );

  return (
    <div className={"space-y-3"}>
      <Section>
        <Field label={"parent"}>
          {container.parentContainerId === null ? (
            "— (root)"
          ) : (
            <LinkButton onClick={onSelectParentContainer}>#{container.parentContainerId}</LinkButton>
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

      <Section title={"bindings"} count={container.bindings.length} icon={<Link />}>
        {container.bindings.length === 0 ? (
          <span className={"text-fg-muted"}>—</span>
        ) : (
          container.bindings.map((binding) => {
            const status: BindingStatus = getBindingStatus(container, binding);

            return (
              <div
                key={binding.token.name}
                className={cn("flex items-center gap-1", status === BindingStatus.Inactive ? "opacity-60" : null)}
              >
                <LinkButton
                  onClick={() =>
                    actions.select({ kind: "binding", containerId: container.containerId, token: binding.token.name })
                  }
                >
                  {binding.token.name}
                </LinkButton>

                <Tag
                  tone={
                    binding.type === BindingType.Value
                      ? "info"
                      : binding.type === BindingType.Instance
                        ? "accent"
                        : "warn"
                  }
                >
                  {binding.type}
                </Tag>

                {binding.scope === BindingScope.Transient ? <Tag tone={"warn"}>Transient</Tag> : null}

                {status === BindingStatus.Inactive || status === BindingStatus.Unrealized ? (
                  <DetailStatusTag status={status} />
                ) : null}
              </div>
            );
          })
        )}
      </Section>

      <Section title={"plugins"} count={container.plugins.length} icon={<Puzzle />}>
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

      <Section title={"lifecycle history"} icon={<History />}>
        <DetailHistory events={history} onSelectBinding={onSelectBinding} />
      </Section>
    </div>
  );
}
