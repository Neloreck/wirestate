import {
  type DevtoolsBinding,
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsInstance,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";
import { useCallback, useMemo } from "react";

import { type InspectBindingFn, type InspectFn } from "@/bridge/bridge.messages";
import { Field, Section, Tag } from "@/panel/components/ui";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import {
  BindingStatus,
  getBindingStatus,
  mayRealizeInstance,
  realizingInstance,
  rootIdOfContainer,
  getTokenOfInstanceId,
} from "@/panel/lib/selectors";
import { type Optional } from "@/types/general";

import { FilterToContainerLink } from "./FilterToContainerLink";
import { InstanceSections } from "./InstanceSections";
import { StateTree, type ValueReader } from "./StateTree";
import { StatusTag } from "./StatusTag";

interface BindingDetailProps {
  readonly container: DevtoolsContainerSnapshot;
  readonly binding: DevtoolsBinding;
  readonly actions: PanelActions;
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly inspect: InspectFn;
  readonly inspectBinding: InspectBindingFn;
}

/**
 * Polymorphic detail for a selected binding — the single entry point for everything a container
 * resolves under a token. Always shows binding metadata; a `Value` binding adds its on-demand value
 * tree, and a realized singleton `Instance` binding inlines its live instance (status, handlers,
 * methods, state, history) so there is no separate instance view to navigate to.
 */
export function BindingDetail({
  container,
  binding,
  actions,
  roots,
  log,
  inspect,
  inspectBinding,
}: BindingDetailProps) {
  const status: BindingStatus = getBindingStatus(container, binding);
  const isValue: boolean = binding.type === "Value";
  const realizes: boolean = mayRealizeInstance(binding);
  const instance: Optional<DevtoolsInstance> = realizes ? realizingInstance(container, binding) : undefined;
  const rootId: Optional<number> = rootIdOfContainer(roots, container.containerId);

  // Only a `Value` binding carries an inspectable raw value;
  // memoized per (root, binding) so each value-tree node doesn't refetch on every parent re-render.
  const readValue: Optional<ValueReader> = useMemo(
    () => (!isValue || rootId === undefined ? undefined : (path) => inspectBinding(rootId, binding.bindingId, path)),
    [isValue, inspectBinding, rootId, binding.bindingId]
  );

  // A field in the value tree may point at a tracked service; resolve it to the realizing binding.
  const onNavigateByInstanceId = useCallback(
    (containerId: number, instanceId: number): void => {
      const token: Optional<string> = getTokenOfInstanceId(roots, containerId, instanceId);

      if (token !== undefined) {
        actions.select({ kind: "binding", containerId, token });
      }
    },
    [actions, roots]
  );

  const onFilterByContainer = useCallback(
    () => actions.setContainerFilter(container.containerId),
    [actions, container.containerId]
  );

  return (
    <div className={"space-y-3"}>
      <Section title={"binding"}>
        <Field label={"token"}>
          {binding.token.name} <Tag tone={"neutral"}>{binding.token.kind}</Tag>
        </Field>

        <Field label={"type"}>
          <Tag tone={binding.type === "Value" ? "info" : binding.type === "Instance" ? "accent" : "warn"}>
            {binding.type}
          </Tag>
        </Field>

        <Field label={"scope"}>
          <Tag tone={binding.scope === "Transient" ? "warn" : "neutral"}>{binding.scope}</Tag>
        </Field>

        <Field label={"impl"}>{binding.implementation ?? "-"}</Field>

        {status === BindingStatus.Inactive || status === BindingStatus.Unrealized ? (
          <Field label={"status"}>
            <StatusTag status={status} />
          </Field>
        ) : null}
      </Section>

      {isValue ? (
        <Section title={"value"}>
          <StateTree read={readValue} rootLabel={"value"} onNavigate={onNavigateByInstanceId} />
        </Section>
      ) : null}

      {realizes ? (
        instance ? (
          <InstanceSections
            container={container}
            instance={instance}
            log={log}
            roots={roots}
            inspect={inspect}
            actions={actions}
          />
        ) : (
          <Section title={"instance"}>
            <span className={"text-fg-muted"}>not yet realized</span>
          </Section>
        )
      ) : null}

      <FilterToContainerLink onClick={onFilterByContainer} />
    </div>
  );
}
