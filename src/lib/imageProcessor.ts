export type OutputFormat = "jpeg" | "png" | "webp";

const TARGET_SIZE = 5 * 1024 * 1024; // 5MB
const SAFETY_MARGIN = 0.95; // aim for ~4.75MB

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      format,
      quality
    );
  });
}

function getMimeType(format: OutputFormat): string {
  return `image/${format}`;
}

function getExtension(format: OutputFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

export async function processImageFile(
  file: File,
  outputFormat: OutputFormat
): Promise<{ blob: Blob; name: string }> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(img.src);

  const mime = getMimeType(outputFormat);
  const ext = getExtension(outputFormat);
  const baseName = file.name.replace(/\.[^.]+$/, "");

  // For PNG (lossless), we can't control quality — just export directly
  if (outputFormat === "png") {
    const blob = await canvasToBlob(canvas, mime, 1);
    if (blob.size > TARGET_SIZE) {
      // Scale down to fit under 5MB
      const scale = Math.sqrt((TARGET_SIZE * SAFETY_MARGIN) / blob.size);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const smallerBlob = await canvasToBlob(canvas, mime, 1);
      return { blob: smallerBlob, name: `${baseName}.${ext}` };
    }
    return { blob, name: `${baseName}.${ext}` };
  }

  // For JPEG / WebP — use quality reduction, then scale if needed
  let quality = 0.95;
  let blob = await canvasToBlob(canvas, mime, quality);

  // Binary search for optimal quality
  if (blob.size > TARGET_SIZE) {
    let lo = 0.1;
    let hi = 0.95;
    for (let i = 0; i < 10; i++) {
      quality = (lo + hi) / 2;
      blob = await canvasToBlob(canvas, mime, quality);
      if (blob.size > TARGET_SIZE * SAFETY_MARGIN && blob.size > TARGET_SIZE) {
        hi = quality;
      } else if (blob.size < TARGET_SIZE * 0.8) {
        lo = quality;
      } else {
        break;
      }
    }
  }

  // If still over after min quality, scale down
  if (blob.size > TARGET_SIZE) {
    const scale = Math.sqrt((TARGET_SIZE * SAFETY_MARGIN) / blob.size);
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    blob = await canvasToBlob(canvas, mime, quality);
  }

  return { blob, name: `${baseName}.${ext}` };
}

export async function processAndDownloadImages(
  files: File[],
  outputFormat: OutputFormat
): Promise<void> {
  for (const file of files) {
    const { blob, name } = await processImageFile(file, outputFormat);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
