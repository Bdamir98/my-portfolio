"use server";

import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function revalidatePortfolio() {
  revalidatePath("/");
  revalidatePath("/work");
  return { success: true };
}

export async function processAndUploadMedia(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const supabase = await createClient();

  // 1. Check if it's an image
  const isImage = file.type.startsWith("image/") && !file.type.includes("svg");

  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);
  let fileName = file.name;
  let contentType = file.type;

  if (isImage) {
    // 2. Process with Sharp
    const sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    // Resize if too large (matching client-side maxWidth 2560)
    if (metadata.width && metadata.width > 2560) {
      sharpInstance.resize(2560);
    }

    // Convert to WebP
    buffer = Buffer.from(await sharpInstance
      .webp({ quality: 85 })
      .toBuffer());

    // Update filename and content type
    const originalName = file.name.split('.').slice(0, -1).join('.');
    fileName = `${originalName || "image"}.webp`;
    contentType = "image/webp";
  }

  // 3. Upload to Supabase Storage
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`;
  const bucket = "project-media";

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: false
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error(`Failed to upload media: ${uploadError.message}`);
  }

  // 4. Get Public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  // 5. Get Image Dimensions (if image)
  let dims = { width: 0, height: 0, ratio: 0, orientation: "unknown" };
  if (isImage) {
    const finalMetadata = await sharp(buffer).metadata();
    dims = {
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0,
      ratio: (finalMetadata.width || 0) / (finalMetadata.height || 1),
      orientation: (finalMetadata.width || 0) > (finalMetadata.height || 0) ? "landscape" : "portrait"
    };
  }

  return {
    url: data.publicUrl,
    name: fileName,
    dimensions: dims
  };
}
