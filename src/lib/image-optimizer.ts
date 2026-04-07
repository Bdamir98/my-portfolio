/**
 * Optimizes an image file by converting it to WebP and resizing if necessary.
 * Only processes image files; other file types are returned as-is.
 * 
 * @param file The original File object from a dropzone or input
 * @param maxWidth The maximum width for the image (default 2560px)
 * @param quality The quality level for WebP compression (0 to 1, default 0.85)
 */
export async function optimizeImage(
  file: File, 
  maxWidth = 2560, 
  quality = 0.85
): Promise<{ blob: Blob; name: string }> {
  // If not an image file that the browser can decode, return the original
  if (!file.type.startsWith("image/") || file.type.includes("svg")) {
    return { blob: file, name: file.name };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Handle resizing if width is greater than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not initialize canvas context"));
        return;
      }

      // Draw and optimize
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Replace original extension with .webp
            const originalName = file.name.split('.').slice(0, -1).join('.');
            const newName = (originalName || "image") + ".webp";
            resolve({ blob, name: newName });
          } else {
            reject(new Error("Canvas export failed"));
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image for optimization"));
    };
  });
}
