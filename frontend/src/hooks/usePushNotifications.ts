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

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    const initializePush = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check current subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        
        // Sync with backend to get current status
        if (existingSubscription) {
          console.log('Found existing browser subscription, syncing with backend...');
          await sendSubscriptionToBackend(existingSubscription);
        }
        
        // Fetch mute status from backend
        await fetchMuteStatus();

        // Check permission
        if ('Notification' in window) {
          setPermission(Notification.permission);
        }
      } catch (error) {
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
        // Отладочный alert
        console.log('Sending subscription to backend...');
        
        const payload = {
          endpoint: subscription.endpoint,
          p256dh: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))
          ),
          auth: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))
          )
        };

        console.log('Payload:', JSON.stringify(payload).substring(0, 100) + '...');

        await api.post('/push/subscribe', payload);
        
        setIsSubscribed(true);
        console.log('Subscription synced with backend');
      } catch (error: any) {
        console.error('Failed to sync subscription:', error);
      }
    };

    initializePush();
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await subscribe();
    }
  };

  const subscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

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
      console.log('Push subscription created');
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        // Remove from backend
        await api.delete('/push/unsubscribe', {
          data: { endpoint: existingSubscription.endpoint }
        });

        await existingSubscription.unsubscribe();
        setIsSubscribed(false);
        console.log('Push subscription removed');
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
    }
  };

  return {
    isSubscribed,
    permission,
    isMuted,
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
