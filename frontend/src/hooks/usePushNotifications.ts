import { useEffect, useState } from 'react';
import api from '../api/axios';

// VAPID Public Key - нужно заменить на реальный ключ из бэкенда
const VAPID_PUBLIC_KEY = 'BDY0mHuJciNadYkl7q9fZaATstZytiQscvBlR4SOTgEkzxdAdiRGNA34zmrB_S-VNeTWBxAlZ0Bda-hAZGE_oXo';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isMuted, setIsMuted] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [debug, setDebug] = useState<string>('');

  const log = (msg: string) => {
    console.log(`[Push Debug] ${msg}`);
    setDebug(prev => prev + '\n' + msg);
  };

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      log('❌ Push notifications not supported');
      return;
    }

    const initializePush = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        setSwRegistered(true);
        log('✅ Service Worker registered: ' + registration.scope);

        // Check current subscription
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
          log('✅ Browser subscription found: ' + existingSubscription.endpoint.substring(0, 50) + '...');
          await sendSubscriptionToBackend(existingSubscription);
        } else {
          log('⚠️ No browser subscription found');
        }

        // Fetch mute status from backend
        await fetchMuteStatus();

        // Check permission
        if ('Notification' in window) {
          setPermission(Notification.permission);
          log('Notification permission: ' + Notification.permission);
        }
      } catch (error: any) {
        log('❌ Error initializing push: ' + error.message);
        console.error('Error initializing push:', error);
      }
    };

    const fetchMuteStatus = async () => {
      try {
        const res = await api.get('/push/status');
        setIsMuted(res.data.isMuted);
        setIsSubscribed(res.data.isSubscribed);
      } catch (error) {
        console.error('Failed to fetch mute status:', error);
      }
    };

    const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
      try {
        log('Syncing with backend...');

        const payload = {
          endpoint: subscription.endpoint,
          p256dh: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))
          ),
          auth: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))
          )
        };

        await api.post('/push/subscribe', payload);

        setIsSubscribed(true);
        log('✅ Subscription synced with backend');
      } catch (error: any) {
        log('❌ Failed to sync: ' + error.message);
        console.error('Failed to sync subscription:', error);
      }
    };

    initializePush();
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      log('❌ Notifications not supported');
      return;
    }

    log('Requesting permission...');
    const result = await Notification.requestPermission();
    setPermission(result);
    log('Permission result: ' + result);

    if (result === 'granted') {
      await subscribe();
    }
  };

  const subscribe = async () => {
    try {
      log('Creating subscription...');
      const registration = await navigator.serviceWorker.ready;

      // Unsubscribe first if exists (fix stale subscription)
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        log('Removing old subscription...');
        await existing.unsubscribe();
        try {
          await api.delete('/push/unsubscribe', { data: { endpoint: existing.endpoint } });
        } catch (e) { /* ignore */ }
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      log('Subscription created: ' + subscription.endpoint.substring(0, 50) + '...');

      // Send subscription to backend
      await api.post('/push/subscribe', {
        endpoint: subscription.endpoint,
        p256dh: btoa(
          String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))
        ),
        auth: btoa(
          String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))
        )
      });

      setIsSubscribed(true);
      log('✅ Push subscription saved to backend');
    } catch (error: any) {
      log('❌ Subscribe error: ' + error.message);
      console.error('Error subscribing to push:', error);
    }
  };

  const resetSubscription = async () => {
    log('🔄 Resetting subscription...');
    setIsSubscribed(false);
    try {
      await unsubscribe();
    } catch (e) { /* ignore */ }
    // Wait a bit then resubscribe
    await new Promise(r => setTimeout(r, 500));
    await requestPermission();
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        log('Removing subscription from backend...');
        await api.delete('/push/unsubscribe', {
          data: { endpoint: existingSubscription.endpoint }
        });

        await existingSubscription.unsubscribe();
        setIsSubscribed(false);
        log('✅ Push subscription removed');
      }
    } catch (error: any) {
      log('❌ Unsubscribe error: ' + error.message);
      console.error('Error unsubscribing from push:', error);
    }
  };

  return {
    isSubscribed,
    permission,
    isMuted,
    swRegistered,
    debug,
    resetSubscription,
    toggleMute: async () => {
      try {
        // Call backend to toggle the flag
        const res = await api.post('/push/toggle-mute');
        setIsMuted(res.data.isMuted);
      } catch (error) {
        console.error('Failed to toggle mute:', error);
      }
    },
    requestPermission,
    subscribe,
    unsubscribe
  };
}
