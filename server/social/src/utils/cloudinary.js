import fs from 'fs';
import path from 'path';

/**
 * Uploads a local file to Cloudinary (if configured) or serves from local uploads directory.
 * Automatically handles images and videos.
 */
export const uploadLocalFileToCloudinary = async (filePath, mimeType) => {
  const filename = path.basename(filePath);
  const localUrl = `/uploads/${filename}`;

  // Check if Cloudinary credentials are provided
  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );

  if (hasCloudinary) {
    try {
      const { v2: cloudinary } = await import('cloudinary');
      if (process.env.CLOUDINARY_URL) {
        cloudinary.config();
      } else {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
          api_key: process.env.CLOUDINARY_API_KEY.trim(),
          api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
        });
      }

      const resourceType = mimeType && mimeType.startsWith('video/') ? 'video' : 'image';
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: resourceType,
        folder: 'mediamation',
      });

      // Clean up local temp file after cloud upload
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {}

      return result.secure_url;
    } catch (error) {
      console.warn('[Cloudinary] Upload notice, serving via local static server:', error.message);
    }
  }

  return localUrl;
};
