/** Absolute site origin (no trailing slash), from PUBLIC_SITE_URL. */
export const siteUrl = (process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
