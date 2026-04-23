import { DevCardType } from '../types';

export function DevCard({ card, onClick }: { card: DevCardType, onClick: () => void }) {
  return (
    <button id={`dev-card-${card}`} onClick={onClick}>
      {card}
    </button>
  );
}
