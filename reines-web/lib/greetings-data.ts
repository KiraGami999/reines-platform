export type GreetingPeriod = "morning" | "afternoon" | "evening";

export type PortalGreetingSettings = {
  enabled: boolean;
  morning: string[];
  afternoon: string[];
  evening: string[];
};

export const DEFAULT_PORTAL_GREETINGS: PortalGreetingSettings = {
  enabled: true,
  morning: [
    "Good morning",
    "Muli bwanji?",
    "Mwawuka uli?",
    "Mwadzuka bwanji?",
    "Have a great morning",
  ],
  afternoon: [
    "Good afternoon",
    "Muli bwanji?",
    "Zikomo",
    "Masana abwino",
    "Hope your day is going well",
  ],
  evening: [
    "Good evening",
    "Muli bwanji?",
    "Usiku wabwino",
    "Madzulo abwino",
    "Hope you had a good day",
  ],
};

export const MAX_GREETING_VARIANTS = 5;
