/** Formats a Decimal/number as Malawian Kwacha */
export function formatMWK(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-MW", {
    style:    "currency",
    currency: "MWK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/** Relative time string: "2 hours ago", "Just now" */
export function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60)    return "Just now";
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/** Short date: "15 Jan 2025" */
export function shortDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/** Full datetime: "15 Jan 2025, 14:30" */
export function fullDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Truncates a string to maxLen characters */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
