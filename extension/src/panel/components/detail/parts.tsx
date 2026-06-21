import { LinkButton, Tag } from "@/panel/components/ui";

/** A lifecycle chip for a singleton instance binding (`active` / `inactive` / `unrealized`). */
export function StatusTag({ status }: { status: "active" | "inactive" | "unrealized" }) {
  return <Tag tone={status === "active" ? "ok" : status === "inactive" ? "muted" : "warn"}>{status}</Tag>;
}

/** The "filter the Timeline to this container" cross-link shown at the foot of a detail view. */
export function FilterToContainerLink({ onClick }: { onClick: () => void }) {
  return (
    <div>
      <LinkButton onClick={onClick}>⤵ Filter Timeline to this container</LinkButton>
    </div>
  );
}
