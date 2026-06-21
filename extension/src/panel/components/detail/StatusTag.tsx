import { Tag } from "@/panel/components/ui";

interface StatusTagProps {
  readonly status: "active" | "inactive" | "unrealized";
}

/** A lifecycle chip for a singleton instance binding (`active` / `inactive` / `unrealized`). */
export function StatusTag({ status }: StatusTagProps) {
  return <Tag tone={status === "active" ? "ok" : status === "inactive" ? "muted" : "warn"}>{status}</Tag>;
}
