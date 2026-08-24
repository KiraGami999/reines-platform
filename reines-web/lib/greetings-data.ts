export type GreetingPeriod = "morning" | "afternoon" | "evening";

export type PortalGreetingSettings = {
  enabled: boolean;
  morning: string[];
  afternoon: string[];
  evening: string[];
};

export const DEFAULT_PORTAL_GREETINGS: PortalGreetingSettings = {
  enabled: true,
  morning: ["Good morning", "Muli bwanji?", "Mwawuka uli?"],
  afternoon: ["Good afternoon", "Muli bwanji?", "Zikomo"],
  evening: ["Good evening", "Muli bwanji?", "Usiku wabwino"],
};

export const MAX_GREETING_VARIANTS = 3;
