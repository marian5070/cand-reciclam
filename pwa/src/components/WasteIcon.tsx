import {
  Leaf,
  Recycle,
  Trash2,
  Sofa,
  Cpu,
  Shirt,
  Wine,
} from 'lucide-react';
import type { WasteType } from '../lib/types.js';

const ICON = {
  menajer: Trash2,
  reciclabil_uscat: Recycle,
  bio: Leaf,
  voluminoase: Sofa,
  deee: Cpu,
  textile: Shirt,
  sticla: Wine,
} satisfies Record<WasteType, React.ElementType>;

const TINT: Record<WasteType, string> = {
  menajer: 'oklch(52% 0.06 230)',
  reciclabil_uscat: 'oklch(58% 0.14 150)',
  bio: 'oklch(55% 0.16 135)',
  voluminoase: 'oklch(56% 0.11 55)',
  deee: 'oklch(55% 0.13 285)',
  textile: 'oklch(60% 0.13 340)',
  sticla: 'oklch(60% 0.11 200)',
};

export function wasteTint(type: WasteType): string {
  return TINT[type];
}

export function WasteIcon({
  type,
  size = 20,
  className,
}: {
  type: WasteType;
  size?: number;
  className?: string;
}) {
  const Icon = ICON[type];
  const color = TINT[type];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg ${className ?? ''}`}
      style={{
        color,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
        width: size + 10,
        height: size + 10,
      }}
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}
