import { LinkButton } from "@/panel/components/ui";

interface DetailFilterToContainerButtonProps {
  readonly onClick: () => void;
}

/**
 * The "filter the Timeline to this container" cross-link shown at the foot of a detail view.
 */
export function DetailFilterToContainerButton({ onClick }: DetailFilterToContainerButtonProps) {
  return (
    <div>
      <LinkButton onClick={onClick}>⤵ Filter Timeline to this container</LinkButton>
    </div>
  );
}
