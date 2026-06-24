import { type PropsWithChildren } from "react";

interface LinkButtonProps extends PropsWithChildren {
  readonly onClick: () => void;
}

/**
 * An inline link-styled button (for drill-in / cross-link actions).
 */
export function LinkButton({ onClick, children }: LinkButtonProps) {
  return (
    <button className={"text-left text-sky-600 hover:underline dark:text-sky-400"} type={"button"} onClick={onClick}>
      {children}
    </button>
  );
}
