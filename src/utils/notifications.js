import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

export async function requestUserPermission() {
  // For Android 13+, we need to explicitly request POST_NOTIFICATIONS
  if (Platform.OS === 'android') {
    const Notifications = require('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Notification permission status:', status);
  }

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    
    // Create notification channel for Android
    if (Platform.OS === 'android') {
      const { setNotificationChannelAsync, AndroidImportance } = require('expo-notifications');
      await setNotificationChannelAsync('updates', {
        name: 'Market Updates',
        importance: AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('Notification channel "updates" created');
    }
    
    subscribeToTopic();
  }
}

export async function subscribeToTopic() {
  try {
    // Subscribe all users to the 'all_updates' topic
    await messaging().subscribeToTopic('all_updates');
    console.log('Subscribed to all_updates topic');
  } catch (error) {
    console.log('Subscription failed:', error);
  }
}

export const getFcmToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.log('Error getting FCM token:', error);
  }
};
