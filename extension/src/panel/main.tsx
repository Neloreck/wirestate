import "@/panel/index.css";

import { createRoot } from "react-dom/client";

import { setPanelTheme, syncPanelTheme } from "@/panel/lib/theme";
import { Panel } from "@/panel/Panel";
import { type Maybe } from "@/types/general";

const container: Maybe<HTMLElement> = document.getElementById("root");

if (container) {
  syncPanelTheme();
  createRoot(container).render(<Panel />);
  chrome.devtools.panels.setThemeChangeHandler(setPanelTheme);
}
