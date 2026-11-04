const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_SIGNATURES = [
  {
    mimeType: 'image/png',
    matches(buffer) {
      return buffer.length >= 8
        && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    },
  },
  {
    mimeType: 'image/jpeg',
    matches(buffer) {
      return buffer.length >= 3
        && buffer[0] === 0xff
        && buffer[1] === 0xd8
        && buffer[2] === 0xff;
    },
  },
  {
    mimeType: 'image/webp',
    matches(buffer) {
      return buffer.length >= 12
        && buffer.toString('ascii', 0, 4) === 'RIFF'
        && buffer.toString('ascii', 8, 12) === 'WEBP';
    },
  },
];

export function detectImageMimeType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length > MAX_IMAGE_BYTES) {
    return null;
  }
  return IMAGE_SIGNATURES.find((signature) => signature.matches(buffer))?.mimeType ?? null;
}

export async function uploadImageToImgBB(buffer, mimeType) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    const error = new Error('Image upload is not configured.');
    error.status = 503;
    throw error;
  }

  const image = new FormData();
  image.append('image', new Blob([buffer], { type: mimeType }), `avatar.${mimeType.split('/')[1]}`);

  let response;
  try {
    response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      body: image,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    const error = new Error('The image hosting service could not be reached.');
    error.status = 502;
    throw error;
  }

  let result;
  try {
    result = await response.json();
  } catch {
    const error = new Error('The image hosting service returned an invalid response.');
    error.status = 502;
    throw error;
  }

  if (!response.ok || result.success !== true || typeof result.data?.url !== 'string') {
    const providerMessage = typeof result.error?.message === 'string'
      ? result.error.message
        .replaceAll(apiKey, '[redacted]')
        .replaceAll(encodeURIComponent(apiKey), '[redacted]')
        .slice(0, 200)
      : undefined;
    console.warn('ImgBB avatar upload rejected', {
      status: response.status,
      errorCode: result.error?.code,
      message: providerMessage,
    });
    const error = new Error('The image could not be uploaded. Please try again.');
    error.status = 502;
    throw error;
  }

  let uploadedUrl;
  try {
    uploadedUrl = new URL(result.data.url);
  } catch {
    const error = new Error('The image hosting service returned an invalid image URL.');
    error.status = 502;
    throw error;
  }
  if (uploadedUrl.protocol !== 'https:' || uploadedUrl.hostname !== 'i.ibb.co') {
    const error = new Error('The image hosting service returned an invalid image URL.');
    error.status = 502;
    throw error;
  }

  return uploadedUrl.toString();
}
