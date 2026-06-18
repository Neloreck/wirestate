import { type DevtoolsPluginInfo } from "@wirestate/core/devtools";

import { Field, Section } from "./parts";

/** Detail view for a selected plugin. */
export function PluginDetail({ plugin }: { plugin: DevtoolsPluginInfo }) {
  return (
    <div className={"space-y-3"}>
      <Section title={"plugin"}>
        <Field label={"name"}>{plugin.name}</Field>
      </Section>

      <Section title={`handles (${plugin.handles.length})`}>
        {plugin.handles.length === 0 ? (
          <span className={"text-fg-muted"}>— (pure observer)</span>
        ) : (
          plugin.handles.map((kind, index) => <div key={index}>{kind}</div>)
        )}
      </Section>
    </div>
  );
}
