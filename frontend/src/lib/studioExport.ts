import { toCanvas, toPng } from 'html-to-image';
import { type ExportFormat } from '@/types/studio';

export async function exportElementAsPngBlob(
  element: HTMLElement,
  options?: { pixelRatio?: number; backgroundColor?: string | undefined }
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness errors
    }
  }

  const canvas = await toCanvas(element, {
    pixelRatio: options?.pixelRatio ?? 3,
    cacheBust: true,
    backgroundColor: options?.backgroundColor,
    filter: (n) => !(n instanceof HTMLElement && n.dataset.exportIgnore !== undefined),
  });

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, 'image/png', 1.0)
  );

  if (!blob) throw new Error('Failed to create PNG blob');
  return blob;
}

export async function copyElementPngToClipboard(
  element: HTMLElement,
  options?: { backgroundColor?: string | undefined }
): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !navigator.clipboard?.write) {
      return false;
    }
    const blob = await exportElementAsPngBlob(element, {
      pixelRatio: 2,
      backgroundColor: options?.backgroundColor,
    });
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

export async function downloadElementPng(
  element: HTMLElement,
  filename: string,
  options?: { backgroundColor?: string | undefined }
): Promise<void> {
  const blob = await exportElementAsPngBlob(element, {
    pixelRatio: 3,
    backgroundColor: options?.backgroundColor,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  a.href = url;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function renderSlide(
  node: HTMLElement,
  format: ExportFormat,
  targetW: number,
  targetH: number,
  pixelRatio = 1,
  transparentBg = false
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness errors
    }
  }

  const canvas = await toCanvas(node, {
    pixelRatio,
    cacheBust: true,
    skipAutoScale: true,
    width: targetW,
    height: targetH,
    backgroundColor: transparentBg ? undefined : '#181615',
    filter: (n) => !(n instanceof HTMLElement && n.dataset.exportIgnore !== undefined),
    style: {
      transform: 'none',
      width: `${targetW}px`,
      height: `${targetH}px`,
    },
  });

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, format === 'png' ? 'image/png' : 'image/jpeg', 0.96)
  );

  if (!blob) throw new Error('Failed to create image blob');
  return blob;
}

/** Exports only the mascot + speech bubble sticker node on a 100% transparent background */
export async function exportMascotStickerPng(
  mascotElement: HTMLElement,
  filename = 'smakr-mascot-sticker.png'
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness errors
    }
  }

  const dataUrl = await toPng(mascotElement, {
    pixelRatio: 3,
    backgroundColor: undefined,
    cacheBust: true,
    filter: (n) => !(n instanceof HTMLElement && n.dataset.exportIgnore !== undefined),
  });

  const a = document.createElement('a');
  a.download = filename;
  a.href = dataUrl;
  a.click();
}

export function makeFile(blob: Blob, name: string, format: ExportFormat) {
  return new File([blob], `${name}.${format === 'png' ? 'png' : 'jpg'}`, {
    type: format === 'png' ? 'image/png' : 'image/jpeg',
  });
}

/** Native mobile share sheet; returns false if unsupported or cancelled. */
export async function shareFiles(files: File[]): Promise<boolean> {
  if (!navigator.canShare || !navigator.canShare({ files })) return false;
  try {
    await navigator.share({ files, title: 'Smakr Oslo Visual' });
    return true;
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return true;
    return false;
  }
}

/** Direct browser download without opening share sheet dialog. */
export async function downloadFiles(files: File[]) {
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.download = file.name;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    await new Promise((r) => setTimeout(r, 450));
  }
}

/** Exports the vector SVG element inside a mascot container for Figma editing */
export function downloadMascotSvg(
  containerElement: HTMLElement,
  filename = 'smakr-mascot.svg'
): void {
  const svgNode = containerElement.querySelector('svg');
  if (!svgNode) throw new Error('No SVG element found in container');

  const clonedSvg = svgNode.cloneNode(true) as SVGSVGElement;
  if (!clonedSvg.getAttribute('xmlns')) {
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  const svgString = new XMLSerializer().serializeToString(clonedSvg);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  a.href = url;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
