import webpush from 'web-push';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@finhealth.com.br',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: { title: string; body: string; url?: string }
) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('[push] VAPID keys not configured, skipping push');
    return { success: false, error: 'VAPID keys not configured' };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    console.error('[push] Failed to send:', error.message);
    return { success: false, error: error.message, statusCode: error.statusCode };
  }
}
