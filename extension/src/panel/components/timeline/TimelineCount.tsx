import { useInjection } from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";
import { useMemo } from "react";

import { filterLogBy } from "@/panel/lib/selectors";
import { type TimelineFilter } from "@/panel/lib/types";
import { BridgeService } from "@/panel/services/bridge.service";

interface TimelineCountProps {
  readonly filter: TimelineFilter;
}

/**
 * The filtered-delta count shown on the (possibly collapsed) Timeline toggle. Isolated so the count
 * tracks the log without re-rendering the panel shell.
 */
export const TimelineCount = observer(function TimelineCount({ filter }: TimelineCountProps) {
  const bridgeService: BridgeService = useInjection(BridgeService);

  const count: number = useMemo(() => filterLogBy(bridgeService.log, filter).length, [bridgeService.log, filter]);

  return <span className={"text-fg-subtle"}>({count})</span>;
});
