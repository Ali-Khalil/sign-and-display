/** Analytics settings. Empty token = no analytics script is output. */
export const analytics = {
  /** Cloudflare Web Analytics beacon token (cookieless). Owner to supply. */
  cloudflareToken: '',
  /** GA4 measurement ID. Only used when site.features.ga4 is true. */
  ga4MeasurementId: '',
} as const;
