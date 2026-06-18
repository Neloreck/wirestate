import "@/panel/index.css";

import { createRoot } from "react-dom/client";

import { Panel } from "@/panel/Panel";
import { type Maybe } from "@/types/general";

document.documentElement.classList.toggle("dark", chrome.devtools.panels.themeName === "dark");

chrome.devtools.panels.setThemeChangeHandler((theme) =>
  document.documentElement.classList.toggle("dark", theme === "dark")
);

const container: Maybe<HTMLElement> = document.getElementById("root");

if (container) {
  // No StrictMode here on purpose: we don't want the panel's own double-invoked effects churning the bridge connection.
  createRoot(container).render(<Panel />);
}
