import { useEffect, useState, type ReactNode } from 'react';

/**
 * Minimal history-API router. No dependency, ~80 LOC.
 * Supports parameterized paths like /sector/:N and /adresa/:streetId/:number.
 */

export type Route = {
  path: string;
  render: (params: Record<string, string>) => ReactNode;
};

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const pSeg = pattern.split('/').filter(Boolean);
  const uSeg = pathname.split('/').filter(Boolean);
  if (pSeg.length !== uSeg.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pSeg.length; i++) {
    const p = pSeg[i]!;
    const u = uSeg[i]!;
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(u);
    } else if (p !== u) {
      return null;
    }
  }
  return params;
}

export function usePathname(): string {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );
  useEffect(() => {
    const handler = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handler);
    window.addEventListener('cr:navigate', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('cr:navigate', handler);
    };
  }, []);
  return pathname;
}

/** Programmatic navigation — updates URL + triggers re-render */
export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (opts.replace) {
    window.history.replaceState({}, '', to);
  } else {
    window.history.pushState({}, '', to);
  }
  window.dispatchEvent(new Event('cr:navigate'));
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

/** Link component — uses history API instead of full page reload */
export function Link({
  to,
  children,
  className,
  onClick,
  ...rest
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'>) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** Finds first matching route; returns rendered element or null */
export function Router({ routes, notFound }: { routes: Route[]; notFound: ReactNode }) {
  const pathname = usePathname();
  for (const r of routes) {
    const params = matchPath(r.path, pathname);
    if (params) return <>{r.render(params)}</>;
  }
  return <>{notFound}</>;
}
