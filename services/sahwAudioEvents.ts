import type { ActiveSahwEvent, SahwAlert } from '../types/prayer';

/** Identity is per event, not per type/rakah: a later event may have the same details. */
export function createSahwAudioEventTracker() {
  const events = new WeakSet<ActiveSahwEvent>();
  const alerts = new WeakSet<SahwAlert>();

  return (activeEvent: ActiveSahwEvent | null, latestAlert: SahwAlert | null) => {
    const newAlert = latestAlert !== null && !alerts.has(latestAlert);
    if (latestAlert) alerts.add(latestAlert);

    if (activeEvent) {
      if (events.has(activeEvent)) return false;
      events.add(activeEvent);
      return true;
    }

    // Some confirmed alerts resolve within the same engine update, so there
    // is no active event left to observe. Consume their alert object once.
    return newAlert;
  };
}
