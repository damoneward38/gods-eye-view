/**
 * Await the provider probe before activating traffic renderers. The caller's
 * generation predicate prevents an old async enable from resurrecting event
 * listeners after a newer disable/re-enable intent.
 */
export async function activateTrafficAfterStatus({
  waitForStatus,
  isCurrent,
  isAvailable,
  onUnavailable,
  onReady,
}) {
  await waitForStatus();
  if (!isCurrent()) return false;
  if (!isAvailable()) {
    onUnavailable();
    return true;
  }
  onReady();
  return true;
}
