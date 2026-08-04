export type ClientLogoItem = {
  id: string;
  name: string;
  /** Logo variant shown in light mode. */
  lightLogoUrl: string;
  /** Logo variant shown in dark mode. Falls back to lightLogoUrl when empty. */
  darkLogoUrl: string;
  websiteUrl: string;
  sortOrder: number;
};

export type ClientLogosSettings = {
  visible: boolean;
};

export const FALLBACK_CLIENT_LOGOS_SETTINGS: ClientLogosSettings = {
  visible: true,
};

/** No dummy placeholders — the section stays hidden until real logos are added. */
export const FALLBACK_CLIENT_LOGOS: ClientLogoItem[] = [];
