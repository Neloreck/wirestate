import { type PropsWithChildren } from "react";

export type TagTone = "neutral" | "info" | "accent" | "ok" | "warn" | "muted";

export type TagVariant = "solid" | "outline";

const TAG_TONE: Record<TagTone, string> = {
  neutral: "bg-zinc-500/15 text-fg-muted",
  info: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  accent: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
  ok: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warn: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  muted: "bg-zinc-500/20 text-fg-muted",
};

const TAG_OUTLINE: Record<TagTone, string> = {
  neutral: "border-zinc-500/40 text-fg-muted",
  info: "border-sky-500/40 text-sky-600 dark:text-sky-400",
  accent: "border-fuchsia-500/40 text-fuchsia-600 dark:text-fuchsia-400",
  ok: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  warn: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  muted: "border-zinc-500/40 text-fg-muted",
};

interface TagProps extends PropsWithChildren {
  readonly tone?: TagTone;
  readonly variant?: TagVariant;
}

/**
 * A small chip used for binding metadata, lifecycle status, and handler channels.
 */
export function Tag({ tone = "neutral", variant = "solid", children }: TagProps) {
  if (variant === "outline") {
    return <span className={`rounded border px-1 ${TAG_OUTLINE[tone]}`}>{children}</span>;
  }

  return <span className={`rounded px-1 text-2xs tracking-wide uppercase ${TAG_TONE[tone]}`}>{children}</span>;
}
