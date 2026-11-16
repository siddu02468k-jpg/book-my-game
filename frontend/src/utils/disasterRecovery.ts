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
const DUMMY_IDS = ['ven_1', 'ven_2', 'ven_3', 'ven_4', 'ven_5'];

export interface DrSnapshot {
  savedAt: string;
  venuesCount: number;
  backupData: any;
}

/** Save full backup JSON to localStorage. */
export function saveLocalSnapshot(backupData: any): void {
  try {
    if (!backupData || !Array.isArray(backupData.venues)) return;
    
    // Filter out legacy dummy venues before saving snapshot
    const realVenues = backupData.venues.filter((v: any) => !DUMMY_IDS.includes(v.id));
    if (realVenues.length === 0) {
      clearLocalSnapshot();
      return;
    }

    const snapshot: DrSnapshot = {
      savedAt: new Date().toISOString(),
      venuesCount: realVenues.length,
      backupData: {
        ...backupData,
        venues: realVenues
      }
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    localStorage.setItem(SAVED_AT_KEY, snapshot.savedAt);
    localStorage.setItem(VENUE_COUNT_KEY, String(snapshot.venuesCount));
  } catch (err) {
    console.warn('[DR] Could not save local snapshot:', err);
  }
}

/** Read the latest local snapshot, or null if none exists. */
export function loadLocalSnapshot(): DrSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as DrSnapshot;
    
    // Purge legacy dummy snapshots automatically
    if (Array.isArray(snap.backupData?.venues)) {
      const real = snap.backupData.venues.filter((v: any) => !DUMMY_IDS.includes(v.id));
      if (real.length === 0) {
        clearLocalSnapshot();
        return null;
      }
      snap.venuesCount = real.length;
      snap.backupData.venues = real;
    }
    return snap;
  } catch {
    return null;
  }
}

/** Returns true if the server appears freshly wiped (0 venues) but we have a valid snapshot of REAL registered venues. */
export function needsRecovery(serverVenueCount: number): boolean {
  if (serverVenueCount > 0) return false;
  if (sessionStorage.getItem('bmg_dr_dismissed') === 'true') return false;

  const snap = loadLocalSnapshot();
  if (!snap || !Array.isArray(snap.backupData?.venues)) return false;

  const realVenues = snap.backupData.venues.filter((v: any) => !DUMMY_IDS.includes(v.id));
  if (realVenues.length === 0) {
    clearLocalSnapshot();
    return false;
  }

  return true;
}

/** Dismiss recovery and clear any old snapshot. */
export function dismissRecovery(): void {
  clearLocalSnapshot();
  sessionStorage.setItem('bmg_dr_dismissed', 'true');
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

/** Clear the local snapshot. */
export function clearLocalSnapshot(): void {
  localStorage.removeItem(SNAPSHOT_KEY);
  localStorage.removeItem(SAVED_AT_KEY);
  localStorage.removeItem(VENUE_COUNT_KEY);
}
