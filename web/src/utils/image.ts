const MAX_SIDE = 800;
const QUALITY = 0.85;

// Redraws the picture on a canvas before upload. A large picture
// is scaled down and saved as WebP, or JPEG where the browser can't encode
// WebP. Falls back to the original file if the browser can't do either.
export async function prepareCoverImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    // JPEG has no transparency: transparent areas would turn black
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    for (const [type, extension] of [
      ['image/webp', 'webp'],
      ['image/jpeg', 'jpg'],
    ]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, QUALITY),
      );
      // Browsers that can't encode a type silently return a PNG instead
      if (blob?.type === type) {
        const name = file.name.replace(/\.\w+$/, '') || 'cover';
        return new File([blob], `${name}.${extension}`, { type });
      }
    }
    return file;
  } catch {
    return file;
  }
}
