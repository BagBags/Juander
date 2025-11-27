/*
  Helper functions for converting between S3 URLs and CloudFront CDN URLs.
  Uses the following environment variables:
    - AWS_REGION (defaults to ap-southeast-2)
    - S3_BUCKET_NAME (defaults to juander-frontend)
    - CLOUDFRONT_DOMAIN  (e.g. https://d39zx5gyblzxjs.cloudfront.net)
*/

const path = require("path");

const AWS_REGION = process.env.AWS_REGION || "ap-southeast-2";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "juander-frontend";

// Must NOT have trailing slash.
const CLOUDFRONT_DOMAIN = (process.env.CLOUDFRONT_DOMAIN || "").replace(/\/$/, "");

// Construct the canonical S3 base URL used by multer-s3 (virtual-hosted–style).
const S3_BASE = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

/**
 * Convert a direct S3 URL (virtual-hosted–style) to its CloudFront equivalent.
 * If it is already a CloudFront URL or conversion cannot be made, the original
 * string is returned unchanged.
 *
 * @param {string} url – The URL to convert.
 * @returns {string}
 */
function toCdnUrl(url) {
  if (!url || !CLOUDFRONT_DOMAIN) return url;
  if (url.startsWith(CLOUDFRONT_DOMAIN)) return url; // already CDN
  if (url.startsWith(S3_BASE)) {
    return url.replace(S3_BASE, CLOUDFRONT_DOMAIN);
  }
  return url;
}

/**
 * Extract the object key from either a CloudFront URL or a direct S3 URL.
 * Returns null if the key cannot be determined.
 *
 * @param {string} url
 * @returns {string|null}
 */
function extractKey(url) {
  if (!url) return null;
  let stripped = null;
  if (url.includes("amazonaws.com/")) {
    // S3 direct URL: everything after a single bucket base.
    const idx = url.indexOf("amazonaws.com/");
    stripped = url.substring(idx + "amazonaws.com/".length);
  } else if (CLOUDFRONT_DOMAIN && url.startsWith(CLOUDFRONT_DOMAIN)) {
    stripped = url.substring(CLOUDFRONT_DOMAIN.length + 1); // +1 to strip the '/'
  }
  return stripped?.replace(/^\/*/, "") || null;
}

module.exports = {
  toCdnUrl,
  extractKey,
  CLOUDFRONT_DOMAIN,
  S3_BASE,
};
