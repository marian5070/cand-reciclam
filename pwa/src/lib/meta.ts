import { useEffect } from 'react';

/**
 * Sets page metadata (title, description, canonical, OG) imperatively.
 * Call inside page components.
 */
export function usePageMeta({
  title,
  description,
  canonical,
  image,
  noindex,
}: {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
}) {
  useEffect(() => {
    const fullTitle = title.includes('Când reciclăm') ? title : `${title} — Când reciclăm?`;
    document.title = fullTitle;

    setMeta('description', description);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'website', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    if (image) {
      setMeta('og:image', image, true);
      setMeta('twitter:image', image);
    }
    const url = canonical ?? `${window.location.origin}${window.location.pathname}`;
    setLink('canonical', url);
    setMeta('og:url', url, true);
    setMeta('robots', noindex ? 'noindex,nofollow' : 'index,follow');
  }, [title, description, canonical, image, noindex]);
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Inject a JSON-LD structured data block */
export function useStructuredData(data: unknown) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [data]);
}
