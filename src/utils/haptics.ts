/**
 * Cross-platform haptic feedback utility for mobile web apps and PWAs.
 * - On Android / Chromium: Uses standard W3C navigator.vibrate() with calibrated durations (≥45ms).
 * - On iOS Safari / WebKit PWA: Leverages the native <input type="checkbox" switch> + label interaction to trigger Apple's Taptic Engine.
 */

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isHapticsSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  // 1. Android & browsers with W3C Vibration API
  if ('vibrate' in navigator) return true;
  // 2. iOS devices supporting WebKit switch-based haptics
  if (isIOSDevice()) return true;
  return false;
}

export function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('nacc_haptic_feedback_v1') !== 'false';
}

export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nacc_haptic_feedback_v1', String(enabled));
}

// Hidden iOS Taptic Engine Trigger via native form switch
function getOrCreateIOSHapticTrigger(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  let label = document.getElementById('nacc-ios-haptic-label');
  if (!label) {
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    container.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;opacity:0;pointer-events:none;overflow:hidden;z-index:-999;';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.id = 'nacc-ios-haptic-switch';

    label = document.createElement('label');
    label.setAttribute('for', 'nacc-ios-haptic-switch');
    label.id = 'nacc-ios-haptic-label';

    container.appendChild(input);
    container.appendChild(label);
    document.body.appendChild(container);
  }
  return label;
}

function triggerIOSHaptic(pulses: number = 1): void {
  try {
    let label = document.getElementById('nacc-ios-haptic-label');
    if (!label) {
      label = getOrCreateIOSHapticTrigger();
    }
    if (label) {
      label.click();
      if (pulses > 1) {
        setTimeout(() => {
          label?.click();
          if (pulses > 2) {
            setTimeout(() => {
              label?.click();
            }, 120);
          }
        }, 100);
      }
    }
  } catch {
    // Fail silently if restricted by platform policy
  }
}

export function triggerHaptic(
  type: 'correct' | 'incorrect' | 'tap' | 'celebrate',
  forcedEnabled?: boolean
): void {
  const enabled = forcedEnabled !== undefined ? forcedEnabled : isHapticsEnabled();
  if (!isHapticsSupported() || !enabled) return;

  // 1. Android / Chromium W3C Vibration API
  // Using calibrated durations that overcome motor inertia (≥45ms)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (type) {
        case 'tap':
          // Crisp micro-tap
          navigator.vibrate(45);
          break;
        case 'correct':
          // Confident double-pulse success pattern
          navigator.vibrate([60, 45, 60]);
          break;
        case 'incorrect':
          // Distinct alert buzz
          navigator.vibrate([90, 70, 90]);
          break;
        case 'celebrate':
          // Multi-pulse celebration burst
          navigator.vibrate([70, 50, 70, 50, 140]);
          break;
      }
    } catch {
      // Vibration may be restricted if user activation has expired
    }
  }

  // 2. iOS Safari / WebKit native switch trigger
  if (isIOSDevice()) {
    const pulses = type === 'incorrect' ? 2 : type === 'celebrate' ? 3 : 1;
    triggerIOSHaptic(pulses);
  }
}
