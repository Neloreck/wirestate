import { Tag } from "@/panel/components/ui";

/** A lifecycle chip for a singleton instance binding (`active` / `inactive` / `unrealized`). */
export function StatusTag({ status }: { status: "active" | "inactive" | "unrealized" }) {
  return <Tag tone={status === "active" ? "ok" : status === "inactive" ? "muted" : "warn"}>{status}</Tag>;
}
