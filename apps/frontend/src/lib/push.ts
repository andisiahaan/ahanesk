'use client';

/**
 * Web Push utilities untuk frontend.
 * Mendaftarkan service worker dan mengambil push subscription dari browser.
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

/**
 * Get or create a push subscription.
 * NOTE: Hanya boleh dipanggil SETELAH izin sudah granted oleh user.
 * Tidak pernah meminta izin secara otomatis.
 */
export async function getPushSubscription(vapidPublicKey: string): Promise<PushSubscription | null> {
  const reg = await registerServiceWorker();
  if (!reg) return null;

  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  try {
    return await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey as unknown as string });
  } catch {
    return null;
  }
}

/**
 * Unsubscribe from browser push (client-side only).
 * Panggil setelah menghapus endpoint dari backend.
 */
export async function unregisterPushSubscription(): Promise<void> {
  const reg = await registerServiceWorker();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  await sub?.unsubscribe();
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding  = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData  = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
