import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { requestUserPermission } from './src/utils/notifications';

import * as Notifications from 'expo-notifications';

// Configure foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // Add these for newer Expo versions
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Add background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

export default function App() {
  useEffect(() => {
    requestUserPermission();

    // Handle foreground notifications
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message Received in Foreground, triggering banner...');
      
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification?.title || "Update",
            body: remoteMessage.notification?.body || "New market rates are live!",
            data: remoteMessage.data,
            sound: true,
          },
          trigger: null,
        });
        console.log('Banner triggered successfully');
      } catch (err) {
        console.error('Failed to trigger banner:', err);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
