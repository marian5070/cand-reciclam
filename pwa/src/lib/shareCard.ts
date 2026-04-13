import QRCode from 'qrcode';
import type { Address, Pickup } from './types.js';
import { WASTE_LABEL } from './types.js';
import { proximityLabel, DAY_SHORT, MONTH_SHORT } from './time.js';

const W = 1080;
const H = 1920;

const WASTE_COLORS: Record<string, string> = {
  menajer: '#538bb2',
  reciclabil_uscat: '#5fa35a',
  bio: '#6bb03f',
  voluminoase: '#c58a4a',
  deee: '#8b63c4',
  textile: '#c765a0',
  sticla: '#5ab0b5',
};

/** Darker variants of each waste color, for use as TEXT on light/white backgrounds. */
const WASTE_COLORS_DARK: Record<string, string> = {
  menajer: '#2e5878',
  reciclabil_uscat: '#2f6638',
  bio: '#3c6e23',
  voluminoase: '#8a5a24',
  deee: '#553b85',
  textile: '#8d3e6b',
  sticla: '#2f6c70',
};

/** Generate a shareable PNG blob for a schedule. */
export async function renderShareCard(address: Address, pickups: Pickup[]): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient (sage → deep)
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#8bc07f');
  grad.addColorStop(0.5, '#5fa35a');
  grad.addColorStop(1, '#2a5a2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Soft radial highlight top-left
  const rad = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, W * 0.7);
  rad.addColorStop(0, 'rgba(255,255,255,0.22)');
  rad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);

  // Top-left brand mark
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '500 42px "Geist Variable", system-ui';
  ctx.fillText('🌿 când reciclăm?', 72, 120);

  // Address chip
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, 72, 180, W - 144, 90, 24);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  ctx.font = '600 44px "Geist Variable", system-ui';
  const addrLine = `${address.street} · nr. ${address.number}`;
  ctx.fillText(addrLine, 108, 236);

  // Main message — proximity based
  const next = pickups[0];
  if (next) {
    const prox = proximityLabel(next.date);
    ctx.fillStyle = 'white';
    ctx.font = '600 120px "Geist Variable", system-ui';
    ctx.fillText(prox.label.toLowerCase(), 72, 460);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '400 48px "Geist Mono Variable", monospace';
    ctx.fillText(prox.sub, 72, 540);

    // Waste type card
    const tint = WASTE_COLORS[next.wasteType] ?? '#5fa35a';
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    roundRect(ctx, 72, 620, W - 144, 200, 36);
    ctx.fill();

    // Colored stripe
    ctx.fillStyle = tint;
    roundRect(ctx, 72, 620, 24, 200, 36);
    ctx.fill();
    ctx.fillRect(96, 620, 24, 200);

    ctx.fillStyle = '#3a4a3a';
    ctx.font = '500 32px "Geist Variable", system-ui';
    ctx.fillText('se scoate', 148, 688);
    // Use DARK tint variant for text on the white waste card — better contrast
    ctx.fillStyle = WASTE_COLORS_DARK[next.wasteType] ?? tint;
    ctx.font = '700 84px "Geist Variable", system-ui';
    ctx.fillText(WASTE_LABEL[next.wasteType], 148, 780);
  }

  // 7-day mini strip
  const stripY = 900;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '500 30px "Geist Variable", system-ui';
  ctx.fillText('următoarele 7 zile', 72, stripY);

  const daysToShow = 7;
  const stripPad = 72;
  const stripBoxW = (W - stripPad * 2 - 12 * (daysToShow - 1)) / daysToShow;
  const stripBoxH = 200;
  const stripTop = stripY + 32;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const isoDate = d.toISOString().slice(0, 10);
    const dayPickups = pickups.filter((p) => p.date.slice(0, 10) === isoDate);
    const x = stripPad + i * (stripBoxW + 12);

    // Card bg
    ctx.fillStyle = i === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)';
    roundRect(ctx, x, stripTop, stripBoxW, stripBoxH, 24);
    ctx.fill();

    // colored top bar if pickup
    if (dayPickups.length > 0) {
      const tint = WASTE_COLORS[dayPickups[0]!.wasteType] ?? '#5fa35a';
      ctx.fillStyle = tint;
      roundRect(ctx, x, stripTop, stripBoxW, 8, 4);
      ctx.fill();
    }

    // Day of week short
    ctx.fillStyle = i === 0 ? '#2a5a2a' : 'rgba(255,255,255,0.8)';
    ctx.font = '500 22px "Geist Variable", system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(DAY_SHORT[d.getDay()]!, x + stripBoxW / 2, stripTop + 52);

    // Day number
    ctx.fillStyle = i === 0 ? '#1a3a1a' : 'white';
    ctx.font = '600 56px "Geist Mono Variable", monospace';
    ctx.fillText(String(d.getDate()), x + stripBoxW / 2, stripTop + 118);

    ctx.fillStyle = i === 0 ? 'rgba(30,60,30,0.6)' : 'rgba(255,255,255,0.6)';
    ctx.font = '400 22px "Geist Variable", system-ui';
    ctx.fillText(MONTH_SHORT[d.getMonth()]!, x + stripBoxW / 2, stripTop + 150);

    // Mini types
    ctx.font = '600 20px "Geist Variable", system-ui';
    if (dayPickups.length > 0) {
      // TODAY card has white bg — use DARK tint for readability
      // OTHER cards have translucent white on green gradient — use plain white for max contrast
      ctx.fillStyle = i === 0
        ? (WASTE_COLORS_DARK[dayPickups[0]!.wasteType] ?? '#2f6638')
        : '#ffffff';
      ctx.fillText(WASTE_LABEL[dayPickups[0]!.wasteType].slice(0, 10), x + stripBoxW / 2, stripTop + 180);
    } else {
      ctx.fillStyle = i === 0 ? 'rgba(30,60,30,0.5)' : 'rgba(255,255,255,0.55)';
      ctx.font = '500 20px "Geist Variable", system-ui';
      ctx.fillText('—', x + stripBoxW / 2, stripTop + 180);
    }
    ctx.textAlign = 'left';
  }

  // QR + footer
  const qrData = `https://cand-reciclam.madeinro.eu?s=${address.streetId}&n=${address.number}`;
  const qrDataUrl = await QRCode.toDataURL(qrData, {
    margin: 0,
    color: { dark: '#1a3a1a', light: '#ffffff' },
    width: 240,
  });
  const qrImg = await loadImage(qrDataUrl);

  // QR card
  const qrX = W - 72 - 240;
  const qrY = H - 72 - 280;
  ctx.fillStyle = 'white';
  roundRect(ctx, qrX - 28, qrY - 28, 296, 296, 28);
  ctx.fill();
  ctx.drawImage(qrImg, qrX, qrY, 240, 240);

  // URL/brand text
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '500 28px "Geist Variable", system-ui';
  ctx.fillText('scanează pentru program live', 72, H - 240);
  ctx.font = '600 40px "Geist Variable", system-ui';
  ctx.fillText('cand-reciclam.madeinro.eu', 72, H - 188);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '400 22px "Geist Variable", system-ui';
  ctx.fillText('· informăm, nu ne asumăm ca sursă ·', 72, H - 100);
  ctx.fillText(`sursă: ${next?.operator ?? 'operator'}`, 72, H - 72);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Share or download the card. Prefers Web Share API with file if available. */
export async function shareCard(address: Address, pickups: Pickup[]): Promise<'shared' | 'downloaded'> {
  const blob = await renderShareCard(address, pickups);
  const file = new File([blob], `cand-reciclam-${address.street.replace(/\s+/g, '-')}-${address.number}.png`, {
    type: 'image/png',
  });

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    await nav.share({
      files: [file],
      title: 'Când reciclăm?',
      text: `Programul colectării pentru ${address.street} nr. ${address.number}`,
    });
    return 'shared';
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
