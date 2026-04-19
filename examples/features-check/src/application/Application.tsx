import "./Application.css";

import { useEffect } from "react";

import { GeneralControls } from "@/application/components/GeneralControls";
import { QueriesData } from "@/application/components/QueriesData";
import { SignalsLog } from "@/application/components/SignalsLog";
import { ThemeService } from "@/core/services/theme";
import { EGlobalSignal } from "@/core/signals";
import { observer, useService, useSignal } from "@/libs/ioc";

export const Application = observer(() => {
  const themeService: ThemeService = useService(ThemeService);

  // [*] Pass reactivity subscription for specific global signal in React tree.
  useSignal(EGlobalSignal.COUNTER_RESET, () => {
    console.info("[App] counter was reset (observed from React tree)");
  });

  // [*] Pass reactivity subscription for specific global signal in React tree.
  useSignal((signal) => {
    console.info("[App] logging signals:", signal.type, signal.payload);
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
    </>
  );
});
