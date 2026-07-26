/**
 * Portal welcome greeting.
 *
 * Previously this rotated through time-of-day / local-language phrases
 * ("Muli bwanji?", "Mwawuka uli?", etc.), but that made the dashboard header
 * wrap awkwardly with longer names and felt inconsistent. Replaced with a
 * simple, fixed "Welcome, {first name}" greeting.
 */

/** First word of a full name, e.g. "Ronnie Kamkwasi" → "Ronnie". */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Builds the portal welcome greeting for the given name, e.g. "Welcome, Ronnie". */
export function getPortalGreeting(name: string): string {
  return `Welcome, ${firstName(name)}`;
}
