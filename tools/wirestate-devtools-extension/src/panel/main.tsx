import "@/panel/index.css";

import { createRoot } from "react-dom/client";

import { Panel } from "@/panel/Panel";

// Follow Chrome's DevTools light/dark theme (read once at load — DevTools requires a reopen to
// change it, so there's no event to subscribe to). Drives Tailwind's class-based `dark:` variant.
if (chrome.devtools.panels.themeName === "dark") {
  document.documentElement.classList.add("dark");
}

const container: HTMLElement | null = document.getElementById("root");

if (container) {
  // No StrictMode here on purpose: we don't want the panel's own double-invoked effects churning the
  // bridge connection. StrictMode behavior of the *inspected app* is what we validate.
  createRoot(container).render(<Panel />);
}
