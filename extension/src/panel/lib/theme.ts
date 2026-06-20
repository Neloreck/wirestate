/**
 * Todo: Jsdoc.
 *
 */
export function syncPanelTheme(): void {
  document.documentElement.classList.toggle("dark", chrome.devtools.panels.themeName === "dark");
}

/**
 * Todo: Jsdoc.
 *
 * @param theme
 */
export function setPanelTheme(theme: string): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
