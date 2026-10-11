import { toCanvas } from 'html-to-image';
import { type ExportFormat } from '@/types/studio';

export async function renderSlide(
  node: HTMLElement,
  format: ExportFormat,
  targetW: number,
  targetH: number,
  pixelRatio = 1
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
    backgroundColor: '#181615',
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
