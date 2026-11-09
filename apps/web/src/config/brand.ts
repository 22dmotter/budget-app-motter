/**
 * Central product brand config for the website UI.
 *
 * Final product name is undecided — change `name` (and related fields) here
 * and the header, footer, page titles, and copy that import this file will
 * follow. Repo / npm package names stay as-is until you rename those separately.
 */
export const brand = {
  /** Working product name shown in the UI */
  name: "Budget App",
  /** Short line used in metadata / footer */
  tagline: "Christian debt-free stewardship (placeholder)",
  /** Default <title> / Open Graph style description */
  description:
    "Placeholder website for a planned Christian debt-free budgeting app. Not launched. No accounts or billing yet.",
  /** Optional accent mark after the logo wordmark (empty string to hide) */
  logoMark: ".",
  /** Founder story links (About page — not the product brand) */
  founder: {
    name: "Daniel Motter",
    youtubeUrl: "https://www.youtube.com/@DanielEMotter",
    youtubeHandle: "@DanielEMotter",
  },
} as const;

export type Brand = typeof brand;
