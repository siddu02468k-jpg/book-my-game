/**
 * Disaster Recovery Module — Book My Game
 *
 * Strategy: Browser localStorage as a zero-cost, always-available backup.
 *
 * How it works:
 *  1. Every time an owner loads the dashboard, we snapshot the full DB to localStorage.
 *  2. On initial app load we check if the server DB appears empty (fresh Render deploy wipe).
 *  3. If the server is empty but we have a localStorage snapshot → show recovery banner.
 *  4. Owner clicks "Restore Now" → backup is sent to the server restore endpoint.
 *
 * localStorage keys:
 *  bmg_dr_snapshot   → serialized backup JSON
 *  bmg_dr_saved_at   → ISO timestamp of last snapshot
 *  bmg_dr_venues_count → venue count at time of snapshot (for stale detection)
 */

const SNAPSHOT_KEY = 'bmg_dr_snapshot';
const SAVED_AT_KEY = 'bmg_dr_saved_at';
const VENUE_COUNT_KEY = 'bmg_dr_venues_count';

export interface DrSnapshot {
  savedAt: string;
  venuesCount: number;
  backupData: any;
}

/** Save full backup JSON to localStorage. Called after each successful owner data fetch. */
export function saveLocalSnapshot(backupData: any): void {
  try {
    const snapshot: DrSnapshot = {
      savedAt: new Date().toISOString(),
      venuesCount: Array.isArray(backupData?.venues) ? backupData.venues.length : 0,
      backupData
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    localStorage.setItem(SAVED_AT_KEY, snapshot.savedAt);
    localStorage.setItem(VENUE_COUNT_KEY, String(snapshot.venuesCount));
  } catch (err) {
    // localStorage quota exceeded or private browsing — silent fail
    console.warn('[DR] Could not save local snapshot:', err);
  }
}

/** Read the latest local snapshot, or null if none exists. */
export function loadLocalSnapshot(): DrSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DrSnapshot;
  } catch {
    return null;
  }
}

/** Returns true if the server appears freshly wiped (0 venues) but we have a local snapshot with venues. */
export function needsRecovery(serverVenueCount: number): boolean {
  if (serverVenueCount > 0) return false; // server has data — no recovery needed
  const storedCount = parseInt(localStorage.getItem(VENUE_COUNT_KEY) || '0', 10);
  return storedCount > 0;
}

/** How long ago was the last snapshot? Returns a human-readable string. */
export function snapshotAge(): string {
  const savedAt = localStorage.getItem(SAVED_AT_KEY);
  if (!savedAt) return 'Never';
  const diffMs = Date.now() - new Date(savedAt).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/** How many days since the last snapshot (for warning threshold). */
export function snapshotAgeDays(): number {
  const savedAt = localStorage.getItem(SAVED_AT_KEY);
  if (!savedAt) return 999;
  const diffMs = Date.now() - new Date(savedAt).getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

/** Clear the local snapshot (call after a successful server restore). */
export function clearLocalSnapshot(): void {
  localStorage.removeItem(SNAPSHOT_KEY);
  localStorage.removeItem(SAVED_AT_KEY);
  localStorage.removeItem(VENUE_COUNT_KEY);
}
