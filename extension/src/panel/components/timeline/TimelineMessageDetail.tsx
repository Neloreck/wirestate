import type { DevtoolsMessage, DevtoolsMessageResultEvent } from "@wirestate/core/devtools";

import { stringify } from "@/panel/lib/format";
import type { Optional } from "@/types/general";

interface TimelineMessageDetailProps {
  message: DevtoolsMessage;
  result?: Optional<DevtoolsMessageResultEvent>;
}

export function TimelineMessageDetail({ message, result }: TimelineMessageDetailProps) {
  const lines: Array<string> = [
    `type: ${message.type}`,
    `channel: ${message.channel}`,
    `timestamp: ${new Date(message.timestamp).toISOString()}`,
    `payload: ${stringify(message.payload)}`,
  ];

  if (message.source !== undefined) {
    lines.push(`source: ${stringify(message.source)}`);
  }

  if (result) {
    lines.push(`result (${result.outcome}): ${stringify(result.value)}`);
  }

  return lines.join("\n");
}
