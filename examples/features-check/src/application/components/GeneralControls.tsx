import "./GeneralControls.css";

import { useCallback } from "react";

import { CounterService } from "@/core/services/counter";
import { ThemeService } from "@/core/services/theme";
import { EGlobalSignal } from "@/core/signals";
import {
  observer,
  type SignalEmitter,
  useService,
  useSignalEmitter,
} from "@/libs/ioc";

export const GeneralControls = observer(() => {
  const counterService: CounterService = useService(CounterService);
  const themeService: ThemeService = useService(ThemeService);

  const emitSignal: SignalEmitter = useSignalEmitter();

  // [*] Pass ability to emit signals from UI.
  const onDumpData = useCallback(() => {
    emitSignal({
      type: EGlobalSignal.DUMP,
      payload: { at: Date.now() },
    });
  }, [emitSignal]);

  const onUserPinged = useCallback(() => {
    emitSignal({
      type: EGlobalSignal.USER_PINGED,
      payload: { at: Date.now() },
    });
  }, [emitSignal]);

  return (
    <div className={"general-controls"}>
      <div>
        <h2>Wirestate Playground</h2>
        <p>mobx observables + inversify container + custom signals/queries</p>
      </div>

      <div className={"counter-row"}>
        <button
          className={"counter"}
          onClick={() => counterService.increment()}
        >
          Count is {counterService.count} (
          {counterService.isEven ? "even" : "odd"})
        </button>
        <button
          className={"counter ghost"}
          onClick={() => counterService.reset()}
        >
          Reset
        </button>

        <button
          className={"counter ghost"}
          onClick={() => themeService.toggle()}
        >
          Theme: {themeService.theme}
        </button>

        <button className={"counter ghost"} onClick={() => onUserPinged()}>
          Ping (signal)
        </button>

        <button className={"counter ghost"} onClick={() => onDumpData()}>
          Dump services
        </button>
      </div>
    </div>
  );
});
