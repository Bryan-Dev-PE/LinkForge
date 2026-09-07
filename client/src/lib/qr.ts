import QRCode from 'qrcode';

export interface QrRenderOptions {
  text: string;
  size: number;
  margin: number;
  foreground: string;
  background: string;
  logoUrl?: string | null;
}

const LOGO_SCALE = 0.24;

async function resolveLogoDataUrl(logoUrl?: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('data:')) return logoUrl;
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read logo image.'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawLogoOnCanvas(
  canvas: HTMLCanvasElement,
  logo: HTMLImageElement,
  background: string,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dimension = Math.round(canvas.width * LOGO_SCALE);
  const padding = Math.round(dimension * 0.14);
  const total = dimension + padding * 2;
  const x = (canvas.width - total) / 2;
  const y = (canvas.height - total) / 2;
  ctx.save();
  ctx.fillStyle = background;
  ctx.strokeStyle = background;
  ctx.lineWidth = 2;
  const radius = Math.round(total * 0.18);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + total, y, x + total, y + total, radius);
  ctx.arcTo(x + total, y + total, x, y + total, radius);
  ctx.arcTo(x, y + total, x, y, radius);
  ctx.arcTo(x, y, x + total, y, radius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.drawImage(logo, x + padding, y + padding, dimension, dimension);
  ctx.restore();
}

export async function renderQrPng(options: QrRenderOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, options.text, {
    errorCorrectionLevel: 'H',
    margin: Math.max(0, Math.min(12, options.margin)),
    width: Math.max(128, Math.min(2048, options.size)),
    color: {
      dark: options.foreground,
      light: options.background,
    },
  });

  const logoUrl = await resolveLogoDataUrl(options.logoUrl);
  if (logoUrl) {
    const logo = await loadImage(logoUrl);
    drawLogoOnCanvas(canvas, logo, options.background);
  }

  return canvas.toDataURL('image/png');
}

export async function renderQrSvg(options: QrRenderOptions): Promise<string> {
  const svg = await QRCode.toString(options.text, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: Math.max(0, Math.min(12, options.margin)),
    width: Math.max(128, Math.min(2048, options.size)),
    color: {
      dark: options.foreground,
      light: options.background,
    },
  });

  const logoUrl = await resolveLogoDataUrl(options.logoUrl);
  if (!logoUrl) return svg;

  const dimension = Math.round(options.size * LOGO_SCALE);
  const padding = Math.round(dimension * 0.14);
  const total = dimension + padding * 2;
  const offset = (options.size - total) / 2;
  const radius = Math.round(total * 0.18);
  const logo = [
    `<g>`,
    `<rect x="${offset}" y="${offset}" width="${total}" height="${total}" rx="${radius}" fill="${options.background}" stroke="${options.background}" stroke-width="2"/>`,
    `<image href="${logoUrl}" x="${offset + padding}" y="${offset + padding}" width="${dimension}" height="${dimension}" preserveAspectRatio="xMidYMid meet"/>`,
    `</g>`,
  ].join('');
  return svg.replace('</svg>', `${logo}</svg>`);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image.'));
    image.crossOrigin = 'anonymous';
    image.src = src;
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function downloadText(text: string, filename: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}