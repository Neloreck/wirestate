import { BindingScope, BindingType } from "@wirestate/core";
import {
  type DevtoolsBinding,
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsInstance,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";
import { Box, Braces } from "lucide-react";
import { useCallback, useMemo } from "react";

import { type InspectBindingFn, type InspectFn } from "@/bridge/bridge.messages";
import { Field, Section, Tag } from "@/panel/components/ui";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { BindingStatus, getBindingStatus, mayRealizeInstance, realizingInstance } from "@/panel/lib/binding";
import { rootIdOfContainer } from "@/panel/lib/container-tree";
import { getTokenOfInstanceId } from "@/panel/lib/selection";
import { type Optional } from "@/types/general";

import { DetailInstanceSections } from "./DetailInstanceSections";
import { DetailStateTree } from "./DetailStateTree";
import { DetailStatusTag } from "./DetailStatusTag";

interface DetailBindingProps {
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
export function DetailBinding({
  container,
  binding,
  actions,
  roots,
  log,
  inspect,
  inspectBinding,
}: DetailBindingProps) {
  const status: BindingStatus = getBindingStatus(container, binding);
  const isValue: boolean = binding.type === BindingType.Value;
  const canRealizeInstance: boolean = mayRealizeInstance(binding);
  const instance: Optional<DevtoolsInstance> = canRealizeInstance ? realizingInstance(container, binding) : undefined;
  const rootId: Optional<number> = rootIdOfContainer(roots, container.containerId);

  // Only a `Value` binding carries an inspectable raw value;
  // memoized per (root, binding) so each value-tree node doesn't refetch on every parent re-render.
  const readValue = useMemo(
    () =>
      !isValue || rootId === undefined
        ? undefined
        : (path: ReadonlyArray<string | number>) => inspectBinding(rootId, binding.bindingId, path),
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
      <Section>
        <Field label={"token"}>
          {binding.token.name} <Tag tone={"neutral"}>{binding.token.kind}</Tag>
        </Field>

        <Field label={"type"}>
          <Tag
            tone={
              binding.type === BindingType.Value ? "info" : binding.type === BindingType.Instance ? "accent" : "warn"
            }
          >
            {binding.type}
          </Tag>
        </Field>

        <Field label={"scope"}>
          <Tag tone={binding.scope === BindingScope.Transient ? "warn" : "neutral"}>{binding.scope}</Tag>
        </Field>

        <Field label={"impl"}>{binding.implementation ?? "-"}</Field>

        {status === BindingStatus.Inactive || status === BindingStatus.Unrealized ? (
          <Field label={"status"}>
            <DetailStatusTag status={status} />
          </Field>
        ) : null}
      </Section>

      {isValue ? (
        <Section title={"value"} icon={<Braces />}>
          <DetailStateTree read={readValue} rootLabel={"value"} onNavigate={onNavigateByInstanceId} />
        </Section>
      ) : null}

      {canRealizeInstance ? (
        instance ? (
          <DetailInstanceSections
            container={container}
            instance={instance}
            log={log}
            roots={roots}
            inspect={inspect}
            actions={actions}
          />
        ) : (
          <Section title={"instance"} icon={<Box />}>
            <span className={"text-fg-muted"}>not yet realized</span>
          </Section>
        )
      ) : null}
    </div>
  );
}
