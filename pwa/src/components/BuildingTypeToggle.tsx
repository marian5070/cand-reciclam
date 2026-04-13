import { motion } from 'framer-motion';
import { Home, Building2 } from 'lucide-react';
import { InfoHint } from './InfoHint.js';

export function BuildingTypeToggle({
  value,
  onChange,
}: {
  value: 'case' | 'blocuri' | undefined;
  onChange: (v: 'case' | 'blocuri') => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-[color:var(--color-muted)] font-medium flex items-center gap-1.5">
        Locuiești la:
        <InfoHint size={13} side="bottom">
          <p className="font-medium mb-1.5 text-[color:var(--color-fg)]">De ce contează?</p>
          <p>
            Pe această stradă, Romprest are programe <strong>diferite</strong> pentru case individuale și blocuri / asociații.
            Alege tipul tău ca să vezi programul corect.
          </p>
        </InfoHint>
      </span>

      <div
        role="radiogroup"
        className="relative inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 backdrop-blur-xl p-1"
      >
        {(['case', 'blocuri'] as const).map((type) => {
          const active = value === type;
          const Icon = type === 'case' ? Home : Building2;
          return (
            <button
              key={type}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(type)}
              className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'text-[color:var(--color-sage-50)]'
                  : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bt-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-[color:var(--color-sage-700)]"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <Icon size={14} />
                {type === 'case' ? 'casă' : 'bloc'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
