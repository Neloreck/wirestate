import { type PropsWithChildren } from "react";

import { cn } from "@/lib/class-name";

interface LinkButtonProps extends PropsWithChildren {
  className?: string;
  onClick: () => void;
}

/**
 * An inline link-styled button (for drill-in / cross-link actions).
 */
export function LinkButton({ className, children, onClick }: LinkButtonProps) {
  return (
    <button
      className={cn("cursor-pointer text-left font-medium text-sky-600 hover:underline dark:text-sky-400", className)}
      type={"button"}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
