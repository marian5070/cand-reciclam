import { ExternalLink, Phone, Mail, FileText, Smartphone, Globe, FileSpreadsheet, Scale } from 'lucide-react';
import type { OfficialSource } from '../lib/sectors.js';

const ICON_FOR_TYPE = {
  webpage: Globe,
  pdf: FileText,
  docx: FileSpreadsheet,
  'api-scrape': Globe,
  phone: Phone,
  email: Mail,
  hcl: Scale,
  app: Smartphone,
} as const;

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

/**
 * Inline source citation — used next to every fact in the app.
 * Shows emitent, link (new tab), and verified date. Optionally publication date.
 */
export function SourceCitation({
  source,
  compact = false,
  className = '',
}: {
  source: OfficialSource;
  compact?: boolean;
  className?: string;
}) {
  const Icon = ICON_FOR_TYPE[source.type] ?? ExternalLink;
  const displayUrl = source.url.startsWith('http')
    ? new URL(source.url).hostname.replace(/^www\./, '')
    : source.url.startsWith('tel:')
      ? source.url.slice(4)
      : source.url.startsWith('mailto:')
        ? source.url.slice(7)
        : source.url;
  const isExternal = source.url.startsWith('http');

  return (
    <a
      href={source.url}
      {...(isExternal ? { target: '_blank', rel: 'nofollow noopener noreferrer' } : {})}
      className={`inline-flex items-start gap-1.5 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition group ${className}`}
    >
      <Icon size={compact ? 12 : 14} className="mt-0.5 shrink-0" aria-hidden />
      <span className="flex flex-col">
        <span>
          <span className="text-[color:var(--color-fg)] font-medium">{source.emitent}</span>
          {' · '}
          <span className="underline decoration-[color:var(--color-muted)]/50 underline-offset-2 group-hover:decoration-[color:var(--color-fg)]">
            {displayUrl}
          </span>
          {isExternal && <ExternalLink size={10} className="inline ml-0.5 mb-1 opacity-60" aria-hidden />}
        </span>
        {!compact && (
          <span className="text-xs text-[color:var(--color-subtle)]">
            verificat {formatDate(source.verifiedAt)}
            {source.publishedAt && source.publishedAt !== source.verifiedAt && (
              <> · publicat de emitent {formatDate(source.publishedAt)}</>
            )}
          </span>
        )}
      </span>
    </a>
  );
}

/**
 * Block variant — standalone box citing a source, for major facts.
 */
export function SourceBlock({ source, label }: { source: OfficialSource; label?: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-tinted)] p-3">
      {label && (
        <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold mb-1">
          {label}
        </div>
      )}
      <SourceCitation source={source} />
    </div>
  );
}
