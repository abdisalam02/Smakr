import { toCanvas } from 'html-to-image';

export type ExportFormat = 'png' | 'jpeg';

export async function renderSlide(node: HTMLElement, format: ExportFormat): Promise<Blob> {
  const canvas = await toCanvas(node, {
    pixelRatio: 2,
    cacheBust: true,
    skipAutoScale: true,
    // JPEG has no alpha, so give any uncovered pixel a dark base instead of black fringes.
    backgroundColor: '#181615',
    filter: (n) => !(n instanceof HTMLElement && n.dataset.exportIgnore !== undefined),
    style: { transform: 'none' },
  });
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, format === 'png' ? 'image/png' : 'image/jpeg', 0.95)
  );
  if (!blob) throw new Error('Failed to create image');
  return blob;
}

export function makeFile(blob: Blob, name: string, format: ExportFormat) {
  return new File([blob], `${name}.${format === 'png' ? 'png' : 'jpg'}`, {
    type: format === 'png' ? 'image/png' : 'image/jpeg',
  });
}

/** Returns false when the browser has no native share sheet for files. */
export async function shareFiles(files: File[]): Promise<boolean> {
  if (!navigator.canShare || !navigator.canShare({ files })) return false;
  try {
    await navigator.share({ files, title: 'Smakr Oslo' });
  } catch (err) {
    // Closing the share sheet is not an error.
    if ((err as DOMException)?.name !== 'AbortError') return false;
  }
  return true;
}

export async function downloadFiles(files: File[]) {
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.download = file.name;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    // Browsers drop back-to-back downloads without a gap.
    await new Promise((r) => setTimeout(r, 450));
  }
}
