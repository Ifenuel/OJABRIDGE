/**
 * ============================================
 * OJABRIDGE FILE UPLOAD (Cloudinary)
 * ============================================
 * 
 * Handles:
 * - Product image uploads (with optimization)
 * - KYC document uploads
 * - Avatar uploads
 * - Store banner/logo uploads
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// ============================================
// VALIDATION
// ============================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file, allowedTypes, maxSize) {
  if (!file) return { valid: false, error: 'No file provided' };
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
  }
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Max size: ${maxSize / (1024 * 1024)}MB` };
  }
  return { valid: true };
}

// ============================================
// UPLOAD FUNCTIONS
// ============================================

/**
 * Upload image to Cloudinary
 * @param {File} file - The file to upload
 * @param {string} folder - Cloudinary folder (e.g., 'ojabridge/products')
 * @param {Object} options - Additional options
 * @returns {Object} - { url, publicId, width, height, format }
 */
export async function uploadImage(file, folder = 'ojabridge', options = {}) {
  const validation = validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  if (!CLOUD_NAME) {
    return { success: false, error: 'Cloudinary not configured. Set CLOUDINARY_API_KEY in .env.local' };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', options.preset || 'ojabridge_unsigned');
    formData.append('folder', folder);

    // Cloudinary transformation for optimization
    if (options.transform) {
      formData.append('transformation', options.transform);
    } else {
      formData.append('transformation', 'f_auto,q_auto,w_800');
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return { success: false, error: 'Upload failed. Please try again.' };
  }
}

/**
 * Upload KYC document
 */
export async function uploadKycDocument(file, vendorId) {
  const validation = validateFile(file, ALLOWED_DOC_TYPES, MAX_DOC_SIZE);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return uploadImage(file, `ojabridge/kyc/${vendorId}`, {
    transform: 'f_auto,q_auto',
  });
}

/**
 * Upload product image
 */
export async function uploadProductImage(file, vendorId) {
  return uploadImage(file, `ojabridge/products/${vendorId}`, {
    transform: 'f_auto,q_auto,w_800',
  });
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file, userId) {
  return uploadImage(file, `ojabridge/avatars`, {
    transform: 'f_auto,q_auto,w_200,h_200,c_fill',
  });
}

/**
 * Upload store banner
 */
export async function uploadStoreBanner(file, vendorId) {
  return uploadImage(file, `ojabridge/banners/${vendorId}`, {
    transform: 'f_auto,q_auto,w_1200,h_400,c_fill',
  });
}

/**
 * Generate Cloudinary URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - { width, height, crop, quality, format }
 */
export function getImageUrl(publicId, options = {}) {
  if (!publicId || !CLOUD_NAME) return '';

  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;
  
  let transformations = `f_${format},q_${quality}`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  if (crop) transformations += `,c_${crop}`;

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImage(publicId) {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return { success: false, error: 'Cloudinary not configured' };
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = await generateCloudinarySignature(publicId, timestamp);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_id: publicId,
          timestamp,
          api_key: API_KEY,
          signature,
        }),
      }
    );

    const data = await response.json();
    return data.result === 'ok' ? { success: true } : { success: false, error: data.error?.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate Cloudinary signature for signed uploads
 */
async function generateCloudinarySignature(publicId, timestamp) {
  const crypto = await import('crypto');
  const str = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  return crypto.createHash('sha1').update(str).digest('hex');
}
