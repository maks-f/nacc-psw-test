/**
 * Utility for managing Edge Glow Light visual feedback preferences.
 * Provides subtle luminous edge highlights (green/red) upon correct/incorrect answers.
 */

export function isEdgeGlowEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('nacc_edge_glow_v1') !== 'false';
}

export function setEdgeGlowEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nacc_edge_glow_v1', String(enabled));
}
