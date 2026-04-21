import "./Application.css";

import { useEffect } from "react";

import { GeneralControls } from "@/application/components/GeneralControls";
import { QueriesData } from "@/application/components/QueriesData";
import { SignalsLog } from "@/application/components/SignalsLog";
import { GLOBAL_CONFIG } from "@/core/id";
import { ThemeService } from "@/core/services/theme";
import { EGlobalSignal } from "@/core/signals";
import {
  observer,
  useInjection,
  useSignal,
  useSignalHandler,
  useSignals,
} from "@/libs/wirestate";

export const Application = observer(() => {
  const themeService: ThemeService = useInjection(ThemeService);
  const globalConfig: object = useInjection(GLOBAL_CONFIG);

  // [*] Pass reactivity subscription for specific global signal in React tree.
  useSignal(EGlobalSignal.COUNTER_RESET, () => {
    console.info("[Application] Counter was reset (specific signal)");
  });

  // [*] Pass reactivity subscription for specific global signals in React tree.
  useSignals([EGlobalSignal.COUNTER_RESET], () => {
    console.info("[Application] Counter was reset (array of signals)");
  });

  // [*] Pass reactivity subscription for specific global signal in React tree.
  useSignalHandler((signal) => {
    console.info(
      "[Application] Logging ALL signals:",
      signal.type,
      signal.payload,
    );
  });

  // [*] Pass reactivity check from service, sync DOM and state on effect.
  useEffect(() => {
    document.documentElement.dataset.theme = themeService.theme;
  }, [themeService.theme]);

  return (
    <>
      <section id={"controls"} className={"application-section"}>
        <GeneralControls />
      </section>

      <br />

      <section id={"signals-log"} className={"application-section"}>
        <SignalsLog />
      </section>

      <br />

      <section id={"queries-data"} className={"application-section"}>
        <QueriesData />
      </section>

      <br />

      <section id={"global-config"} className={"application-section"}>
        <b>GlobalConfig: {JSON.stringify(globalConfig)}</b>
      </section>
    </>
  );
});
