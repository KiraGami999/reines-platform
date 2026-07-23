/**
 * Time-of-day portal greetings.
 *
 * The client asked for the dashboard welcome message to change depending on
 * the time of day (morning / afternoon / evening), mixing in casual local
 * language phrases alongside English ones so it doesn't feel repetitive.
 *
 * - The *period* (morning/afternoon/evening) is always derived from the
 *   current time in Malawi (Africa/Blantyre), regardless of where the
 *   server hosting the app is physically located, so it stays accurate for
 *   the client's users.
 * - Within a period, one phrase is chosen at random on each dashboard load
 *   so returning users see variety rather than the same line every time.
 *
 * Each phrase already carries its own trailing punctuation (comma or
 * question mark) exactly as supplied, so it can simply be followed by the
 * user's name, e.g. "Muli bwanji? Tadala" or "Good morning, Tadala".
 */

export type DayPeriod = "morning" | "afternoon" | "evening";

const MORNING_GREETINGS = [
  "Good morning,",
  "Muli bwanji?",
  "Mwawuka uli?",
  "Muharuwe saana?",
  "Si zikutheka basi?",
];

const AFTERNOON_GREETINGS = [
  "Good afternoon,",
  "What's good?",
  "Mwaswera bwanji?",
  "Inde bwana,",
  "Nyatwa?",
  "Muthana saana?",
  "Masana abwino?",
];

const EVENING_GREETINGS = [
  "Usiku uwemi?",
  "Khenge?",
  "Madzulo abwino bigge?",
  "Si zikutheka basi?",
  "Mwala mwala?",
  "Good evening beloved,",
];

const GREETINGS_BY_PERIOD: Record<DayPeriod, string[]> = {
  morning: MORNING_GREETINGS,
  afternoon: AFTERNOON_GREETINGS,
  evening: EVENING_GREETINGS,
};

const MALAWI_TIME_ZONE = "Africa/Blantyre";

/** Current hour (0–23) in Malawi local time, regardless of server location. */
function getMalawiHour(date: Date): number {
  const hourString = new Intl.DateTimeFormat("en-US", {
    timeZone: MALAWI_TIME_ZONE,
    hour: "numeric",
    hour12: false,
  }).format(date);
  const hour = parseInt(hourString, 10);
  // Some runtimes render midnight as "24" for hour12: false.
  return Number.isFinite(hour) ? hour % 24 : date.getHours();
}

/** Morning: 05:00–11:59, Afternoon: 12:00–16:59, Evening: 17:00–04:59. */
export function getDayPeriod(date: Date = new Date()): DayPeriod {
  const hour = getMalawiHour(date);
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}

function pickPhrase(period: DayPeriod): string {
  const list = GREETINGS_BY_PERIOD[period];
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Builds a full portal greeting for the given name, e.g. "Muli bwanji? Tadala"
 * or "Good morning, Tadala", matching the current time of day in Malawi.
 */
export function getPortalGreeting(name: string, date: Date = new Date()): string {
  const period = getDayPeriod(date);
  const phrase = pickPhrase(period);
  return `${phrase} ${name}`;
}
