import { useEffect, useState } from 'react';
import api from '../api/axios';

// VAPID Public Key - нужно заменить на реальный ключ из бэкенда
const VAPID_PUBLIC_KEY = 'BG2rB4kX8vP3Q9mN2jL6fR7sT1yU0wE4cH5dA8iO9xK3gM6nV2bZ7qW1rY4tP0sL3kJ8hF6gD5aG2nM9vC4xB7eE';

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
        
        // If subscription exists in browser, ensure backend knows about it too
        if (existingSubscription) {
          console.log('Found existing browser subscription, syncing with backend...');
          await sendSubscriptionToBackend(existingSubscription);
        }

        // Check permission
        if ('Notification' in window) {
          setPermission(Notification.permission);
        }
      } catch (error) {
        console.error('Error initializing push:', error);
      }
    };

    const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
      try {
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

      await sendSubscriptionToBackend(subscription);
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
    requestPermission,
    subscribe,
    unsubscribe
  };
}
