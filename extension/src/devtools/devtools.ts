/**
 * DevTools-page entry.
 * Registers the Wirestate panel in the browser DevTools window.
 * This page itself has no UI — `panel.html` (the React app) is what renders inside the created panel.
 */
chrome.devtools.panels.create("Wirestate ⚙️", "icons/icon-32.png", "src/panel/panel.html", (): void => {
  // Panel created; nothing else to do here. The panel connects to the bridge on its own mount.
});
