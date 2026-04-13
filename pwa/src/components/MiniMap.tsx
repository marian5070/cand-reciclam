import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink, Loader2 } from 'lucide-react';
import type { Address } from '../lib/types.js';

type GeocodeResult = {
  found: boolean;
  lat?: number;
  lng?: number;
  displayName?: string;
};

const ROMPREST_GREEN = '#3a6b3a';

/** Create a custom Leaflet DivIcon styled to match the app palette. */
function makePin() {
  return L.divIcon({
    className: 'cr-pin',
    html: `<span style="
      display:block;width:24px;height:24px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${ROMPREST_GREEN};
      border:2.5px solid white;
      box-shadow:0 4px 12px oklch(20% 0.04 160 / 0.5);
    "></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
}

export function MiniMap({ address }: { address: Address }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [state, setState] = useState<{ status: 'loading' | 'ok' | 'not-found'; data?: GeocodeResult }>({ status: 'loading' });

  useEffect(() => {
    let cancel = false;
    setState({ status: 'loading' });
    const q = `${address.street} ${address.number}, Bucuresti`;
    fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: GeocodeResult) => {
        if (cancel) return;
        if (data.found && typeof data.lat === 'number' && typeof data.lng === 'number') {
          setState({ status: 'ok', data });
        } else {
          setState({ status: 'not-found' });
        }
      })
      .catch(() => !cancel && setState({ status: 'not-found' }));
    return () => {
      cancel = true;
    };
  }, [address.street, address.number]);

  useEffect(() => {
    if (state.status !== 'ok' || !state.data || !containerRef.current) return;
    const { lat, lng } = state.data;
    if (lat === undefined || lng === undefined) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 17,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
        dragging: true,
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      L.marker([lat, lng], { icon: makePin() }).addTo(map);
      mapRef.current = map;
    } else {
      mapRef.current.setView([lat, lng], 17);
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) mapRef.current!.removeLayer(layer);
      });
      L.marker([lat, lng], { icon: makePin() }).addTo(mapRef.current);
    }

    const handler = () => mapRef.current?.invalidateSize();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [state]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const osmUrl = state.status === 'ok' && state.data?.lat && state.data?.lng
    ? `https://www.openstreetmap.org/?mlat=${state.data.lat}&mlon=${state.data.lng}#map=18/${state.data.lat}/${state.data.lng}`
    : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl px-6 mt-8"
    >
      <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/70 overflow-hidden backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--color-border)]">
          <h3 className="flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-[color:var(--color-muted)] font-semibold">
            <MapPin size={16} />
            Pe hartă
          </h3>
          {osmUrl && (
            <a
              href={osmUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-strong)] transition"
            >
              deschide în OpenStreetMap
              <ExternalLink size={11} />
            </a>
          )}
        </div>

        <div className="relative">
          {state.status === 'loading' && (
            <div className="h-[220px] flex items-center justify-center text-sm text-[color:var(--color-muted)]">
              <Loader2 size={16} className="animate-spin mr-2" />
              Caut adresa pe hartă…
            </div>
          )}

          {state.status === 'not-found' && (
            <div className="h-[220px] flex flex-col items-center justify-center text-sm text-[color:var(--color-muted)] px-6 text-center">
              <MapPin size={18} className="mb-2 opacity-60" />
              Nu am putut localiza exact adresa pe hartă.
              Caut-o pe{' '}
              <a
                className="underline ml-1 text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-strong)]"
                href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(address.street + ' ' + address.number + ', Bucuresti')}`}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                OpenStreetMap
              </a>.
            </div>
          )}

          <div
            ref={containerRef}
            className="h-[220px] w-full"
            style={{
              display: state.status === 'ok' ? 'block' : 'none',
              background: 'var(--color-surface-tinted)',
            }}
          />
        </div>

        {state.status === 'ok' && state.data?.displayName && (
          <div className="px-5 py-3 text-[15px] text-[color:var(--color-muted)] leading-snug border-t border-[color:var(--color-border)]">
            {state.data.displayName.split(',').slice(0, 3).join(',').trim()}
          </div>
        )}
      </div>
    </motion.section>
  );
}
