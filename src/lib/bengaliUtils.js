/**
 * bengaliUtils.js
 * Shared server-side utility functions for Bengali numeral handling and
 * chapter/book slug operations. Previously duplicated across 5+ files.
 */

/** Convert Bengali numeral characters to ASCII digits */
export function bengaliToEnglishDigits(str) {
  const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (match) => bengaliNumerals.indexOf(match));
}

/** Extract leading chapter number from a filename (supports Bengali + ASCII digits) */
export function extractChapterNumber(filename) {
  const normalized = bengaliToEnglishDigits(filename);
  const match = normalized.match(/^\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Transform a Cloudinary image URL to request an auto-formatted, quality-optimised,
 * width-capped version. Safe to call with non-Cloudinary URLs — returns the original.
 *
 * @param {string} url   - Raw Cloudinary URL
 * @param {number} width - Target display width in CSS pixels (default 800)
 * @param {number} [dpr] - Device pixel ratio multiplier (default 2 for retina)
 * @returns {string}     - Transformed URL or original if not a Cloudinary URL
 */
export function getCloudinaryUrl(url, width = 800, dpr = 2) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  try {
    // Cloudinary URL format:
    // https://res.cloudinary.com/{cloud}/image/upload/{optional_transforms}/{version?}/{public_id}
    const uploadMarker = '/image/upload/';
    const idx = url.indexOf(uploadMarker);
    if (idx === -1) return url;

    const base = url.slice(0, idx + uploadMarker.length);
    const rest = url.slice(idx + uploadMarker.length);

    // Skip if user already embedded transforms
    const hasTransforms = /^[a-z]_/.test(rest) || /^[a-z][a-z0-9]*,/.test(rest);
    if (hasTransforms) return url;

    const w = Math.round(width * dpr);
    return `${base}f_auto,q_auto:good,w_${w}/${rest}`;
  } catch {
    return url;
  }
}

/** Client-side: convert ASCII digits to Bengali numerals */
export function toBengaliNumber(num) {
  const d = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (n) => d[Number(n)]);
}
