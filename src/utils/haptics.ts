/**
 * Utility for mobile haptic feedback using the HTML5 Vibration API.
 * Provides physical tactile feedback on answer selection and completion.
 */

export function isHapticsSupported(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('nacc_haptic_feedback_v1') !== 'false';
}

export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nacc_haptic_feedback_v1', String(enabled));
}

export function triggerHaptic(
  type: 'correct' | 'incorrect' | 'tap' | 'celebrate',
  forcedEnabled?: boolean
): void {
  const enabled = forcedEnabled !== undefined ? forcedEnabled : isHapticsEnabled();
  if (!isHapticsSupported() || !enabled) return;

  try {
    switch (type) {
      case 'correct':
        // Single crisp pulse for positive reinforcement
        navigator.vibrate(35);
        break;
      case 'incorrect':
        // Distinct double buzz for mistake detection
        navigator.vibrate([40, 60, 40]);
        break;
      case 'tap':
        // Micro tap for UI interactions
        navigator.vibrate(15);
        break;
      case 'celebrate':
        // Celebration pattern for test completion or milestones
        navigator.vibrate([40, 50, 40, 50, 80]);
        break;
    }
  } catch {
    // Vibration may be restricted by platform policy without an explicit gesture
  }
}
