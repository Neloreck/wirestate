import { type DevtoolsBinding, type DevtoolsContainerSnapshot, type DevtoolsInstance } from "@wirestate/core/devtools";

import { mayRealizeInstance, realizingInstance } from "@/panel/selectors";
import { type PanelActions } from "@/panel/use-panel-state";
import { type Optional } from "@/types/general";

import { Field, LinkButton, Section } from "./parts";

interface BindingDetailProps {
  readonly container: DevtoolsContainerSnapshot;
  readonly binding: DevtoolsBinding;
  readonly actions: PanelActions;
}

/** Detail view for a selected binding, with a derived link to its realizing instance. */
export function BindingDetail({ container, binding, actions }: BindingDetailProps) {
  // Only singleton instance bindings produce a single tracked instance; Value/Factory/Transient
  // bindings have nothing for "realized by" to point at, so the section is omitted for them.
  const instance: Optional<DevtoolsInstance> = mayRealizeInstance(binding)
    ? realizingInstance(container, binding)
    : undefined;

  return (
    <div className={"space-y-3"}>
      <Section title={"binding"}>
        <Field label={"token"}>
          {binding.token.name} <span className={"text-neutral-500"}>({binding.token.kind})</span>
        </Field>
        <Field label={"type"}>{binding.type}</Field>
        <Field label={"scope"}>{binding.scope}</Field>
        <Field label={"impl"}>{binding.implementation ?? "—"}</Field>
      </Section>

      {mayRealizeInstance(binding) ? (
        <Section title={"realized by"}>
          {instance ? (
            <LinkButton
              onClick={() =>
                actions.select({ kind: "instance", containerId: container.containerId, className: instance.className })
              }
            >
              {instance.className}
            </LinkButton>
          ) : (
            <span className={"text-neutral-500"}>not yet realized</span>
          )}
        </Section>
      ) : null}
    </div>
  );
}
