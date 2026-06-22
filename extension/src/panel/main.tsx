import "@/panel/index.css";

import { ContainerProvider } from "@wirestate/react";
import { createRoot } from "react-dom/client";

import { setPanelTheme, syncPanelTheme } from "@/panel/lib/theme";
import { Panel } from "@/panel/Panel";
import { BridgeService } from "@/panel/services/bridge.service";
import { PanelTransport } from "@/panel/services/panel.transport";
import { type Maybe } from "@/types/general";

const container: Maybe<HTMLElement> = document.getElementById("root");

if (container) {
  syncPanelTheme();
  createRoot(container).render(
    <ContainerProvider config={{ bindings: [PanelTransport, BridgeService] }}>
      <Panel />
    </ContainerProvider>
  );
  chrome.devtools.panels.setThemeChangeHandler(setPanelTheme);
}
