/**
 * Timezone utilities for PST (UTC-8) handling.
 * Note: We use UTC-8 consistently regardless of daylight saving time.
 */

const PST_OFFSET_MS = -8 * 60 * 60 * 1000; // UTC-8 in milliseconds

/**
 * Get the current time in PST as a Date object.
 */
export function getCurrentTimePST(): Date {
  const now = new Date();
  const pstDate = new Date(now.getTime() + PST_OFFSET_MS);
  return pstDate;
}

/**
 * Format a Date as ISO 8601 string in PST timezone.
 */
export function formatAsPST(date: Date): string {
  const pstDate = new Date(date.getTime() + PST_OFFSET_MS);
  const isoString = pstDate.toISOString();
  // Replace Z with PST offset indicator
  return isoString.replace('Z', '-08:00');
}

/**
 * Get today's date in PST format (YYYY-MM-DD).
 */
export function getTodayPST(): string {
  const pstDate = getCurrentTimePST();
  const year = pstDate.getUTCFullYear();
  const month = String(pstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(pstDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get midnight PST of today.
 */
export function getMidnightTodayPST(): Date {
  const today = getTodayPST();
  const [year, month, day] = today.split('-').map(Number);
  // Create midnight UTC, then adjust for PST offset to get midnight PST in UTC
  const midnightUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  // To get midnight PST in actual UTC time, we add 8 hours
  return new Date(midnightUTC.getTime() + 8 * 60 * 60 * 1000);
}

/**
 * Get midnight PST of tomorrow.
 */
export function getMidnightTomorrowPST(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const [year, month, day] = tomorrowStr.split('-').map(Number);
  const midnightUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return new Date(midnightUTC.getTime() + 8 * 60 * 60 * 1000);
}

/**
 * Get 11:59:59 PM PST (end of day) for today.
 */
export function getEndOfDayPST(): Date {
  const today = getTodayPST();
  const [year, month, day] = today.split('-').map(Number);
  // Create 23:59:59 UTC, then adjust for PST offset to get 23:59:59 PST in UTC
  const endOfDayUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 0));
  // To get 23:59:59 PST in actual UTC time, we add 8 hours
  return new Date(endOfDayUTC.getTime() + 8 * 60 * 60 * 1000);
}

/**
 * Get 11:59:59 PM PST (end of day) for tomorrow.
 */
export function getEndOfDayTomorrowPST(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const [year, month, day] = tomorrowStr.split('-').map(Number);
  const endOfDayUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 0));
  return new Date(endOfDayUTC.getTime() + 8 * 60 * 60 * 1000);
}

/**
 * Calculate seconds until end of day (11:59:59 PM PST).
 * Returns countdown to 11:59:59 PM PST today if before that time,
 * or 11:59:59 PM PST tomorrow if after that time.
 * Maximum is always 24 hours (86400 seconds).
 */
export function secondsUntilEndOfDayPST(): number {
  const now = new Date();
  const endOfToday = getEndOfDayPST();

  // If we're before end of today, count to end of today
  if (now.getTime() < endOfToday.getTime()) {
    return Math.max(0, Math.floor((endOfToday.getTime() - now.getTime()) / 1000));
  }

  // Otherwise, count to end of tomorrow
  const endOfTomorrow = getEndOfDayTomorrowPST();
  const secondsUntil = Math.max(0, Math.floor((endOfTomorrow.getTime() - now.getTime()) / 1000));

  // Ensure we never exceed 24 hours (86400 seconds)
  return Math.min(secondsUntil, 86400);
}

/**
 * Check if a location is within continental US bounds.
 * Continental US: Latitude 24°N to 49.5°N, Longitude 125°W to 66.5°W
 */
export function isLocationInContinentalUS(latitude: number, longitude: number): boolean {
  return latitude >= 24.0 && latitude <= 49.5 && longitude >= -125.0 && longitude <= -66.5;
}

/**
 * Check if a reveal time has passed (i.e., it's safe to show the target number).
 */
export function hasRevealTimePassed(revealTime: Date): boolean {
  const now = new Date();
  return now.getTime() >= revealTime.getTime();
}
