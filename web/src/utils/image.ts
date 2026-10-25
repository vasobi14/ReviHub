const MAX_SIDE = 1200;

// Redraws the picture on a canvas before upload. The copy keeps only the
// pixels: EXIF metadata (camera, GPS location) is gone, and a large photo
// is scaled down. Falls back to the original file if the browser can't do it.
export async function prepareCoverImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext('2d')
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, file.type, 0.9),
    );
    if (!blob || blob.type !== file.type) return file;
    return new File([blob], file.name, { type: file.type });
  } catch {
    return file;
  }
}
