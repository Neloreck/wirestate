import {
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsInstance,
  type DevtoolsMethod,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";
import { Antenna, Box, Braces, Code, History, Power } from "lucide-react";
import { useCallback, useMemo } from "react";

import { type InspectFn } from "@/bridge/bridge.messages";
import { Field, Section, Tag } from "@/panel/components/ui";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { rootIdOfContainer } from "@/panel/lib/container-tree";
import { getLifecycleHistory } from "@/panel/lib/deltas";
import { getTokenOfInstanceId } from "@/panel/lib/selection";
import { type Optional } from "@/types/general";

import { DetailHistory } from "./DetailHistory";
import { DetailStateTree } from "./DetailStateTree";

interface DetailInstanceSectionsProps {
  readonly container: DevtoolsContainerSnapshot;
  readonly instance: DevtoolsInstance;
  readonly log: ReadonlyArray<DevtoolsEvent>;
  readonly roots: ReadonlyArray<DevtoolsRootSnapshot>;
  readonly inspect: InspectFn;
  readonly actions: PanelActions;
}

/**
 * The live-instance facet of a realized singleton `Instance` binding: status, declared handlers,
 * methods, on-demand state, and lifecycle history.
 */
export function DetailInstanceSections({
  container,
  instance,
  log,
  roots,
  inspect,
  actions,
}: DetailInstanceSectionsProps) {
  const status = instance.status;

  const { history, readState } = useMemo(() => {
    const rootId: Optional<number> = rootIdOfContainer(roots, container.containerId);

    return {
      history: getLifecycleHistory(log, container.containerId, {
        instanceId: instance.instanceId,
        className: instance.className,
      }),
      readState:
        rootId === undefined
          ? undefined
          : (path: ReadonlyArray<string | number>) => inspect(rootId, instance.instanceId, path),
    };
  }, [container.containerId, instance.className, instance.instanceId, inspect, log, roots]);

  const [methods, handlerChannels] = useMemo(() => {
    const methods: ReadonlyArray<DevtoolsMethod> = instance.methods ?? [];
    const handlerChannels: Map<string, Set<string>> = new Map();

    for (const handler of instance.handlers) {
      const channels: Set<string> = handlerChannels.get(handler.method) ?? new Set();

      channels.add(handler.channel);
      handlerChannels.set(handler.method, channels);
    }

    return [methods, handlerChannels];
  }, [instance.handlers, instance.methods]);

  const selectByInstanceId = useCallback(
    (containerId: number, instanceId: number): void => {
      const token: Optional<string> = getTokenOfInstanceId(roots, containerId, instanceId);

      if (token !== undefined) {
        actions.select({ kind: "binding", containerId, token });
      }
    },
    [roots, actions]
  );

  const onSelectBinding = useCallback(
    (containerId: number, token: string) => actions.select({ kind: "binding", containerId, token }),
    [actions]
  );

  return (
    <>
      <Section title={"instance"} icon={<Box />}>
        <Field label={"class"}>{instance.className}</Field>
      </Section>

      <Section title={"provision"} icon={<Power />}>
        {status ? (
          <>
            <Field label={"state"}>
              <Tag tone={status.isDeprovisioned === null ? "neutral" : status.isDeprovisioned ? "warn" : "ok"}>
                {status.isDeprovisioned === null
                  ? "not provisioned"
                  : status.isDeprovisioned
                    ? "deprovisioned"
                    : "owned"}
              </Tag>
            </Field>
            <Field label={"provisionId"}>{status.provisionId ?? "—"}</Field>
          </>
        ) : (
          <span className={"text-fg-muted"}>untracked</span>
        )}
      </Section>

      <Section title={"declared handlers"} count={instance.handlers.length} icon={<Antenna />}>
        {instance.handlers.length === 0 ? (
          <span className={"text-fg-muted"}>—</span>
        ) : (
          instance.handlers.map((handler, index) => (
            <div key={index}>
              <Tag tone={"accent"} variant={"outline"}>
                {handler.channel}
              </Tag>{" "}
              {handler.type} → <span className={"text-val-function"}>{handler.method}</span>()
            </div>
          ))
        )}
      </Section>

      <Section title={"methods"} count={methods.length} icon={<Code />}>
        {methods.length === 0 ? (
          <span className={"text-fg-muted"}>—</span>
        ) : (
          methods.map((method) => {
            const channels: Optional<Set<string>> = handlerChannels.get(method.name);

            return (
              <div key={method.name} className={"flex flex-wrap items-center gap-1"}>
                <span>
                  <span className={"text-val-function"}>{method.name}</span>
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

      <Section title={"state"} icon={<Braces />}>
        <DetailStateTree read={readState} rootLabel={"state"} onNavigate={selectByInstanceId} />
      </Section>

      <Section title={"lifecycle history"} icon={<History />}>
        <DetailHistory events={history} onSelectBinding={onSelectBinding} />
      </Section>
    </>
  );
}
