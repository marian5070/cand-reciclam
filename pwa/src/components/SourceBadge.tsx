import { ExternalLink } from 'lucide-react';
import { SOURCE_QUALITY_META, type SourceQuality } from '../lib/types.js';

export function SourceBadge({
  quality,
  url,
  operator,
  compact = false,
}: {
  quality: SourceQuality;
  url: string;
  operator: string;
  compact?: boolean;
}) {
  const meta = SOURCE_QUALITY_META[quality];
  return (
    <a
      href={url}
      target="_blank"
      rel="nofollow noopener noreferrer"
      title={meta.label}
      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/80 px-3 py-1.5 text-sm text-[color:var(--color-muted)] transition hover:text-[color:var(--color-fg)] hover:border-[color:var(--color-accent)]"
    >
      <span
        className={`block size-1.5 rounded-full ${meta.dot}`}
        aria-hidden
      />
      {compact ? meta.short : <span>{operator} · {meta.short}</span>}
      {!compact && <ExternalLink size={11} className="opacity-60" />}
    </a>
  );
}
