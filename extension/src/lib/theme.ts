/**
 * Applies the current Chrome DevTools theme to the panel root element.
 */
export function syncPanelTheme(): void {
  document.documentElement.classList.toggle("dark", chrome.devtools.panels.themeName === "dark");
}

/**
 * Applies a Chrome DevTools theme name to the panel root element.
 *
 * @param theme - The DevTools theme name reported by the theme change handler.
 */
export function setPanelTheme(theme: string): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
