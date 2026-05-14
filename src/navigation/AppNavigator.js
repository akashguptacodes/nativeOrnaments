import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { auth, onAuthStateChanged, database } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Platform } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import FinishProfileScreen from '../screens/FinishProfileScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import SavedScreen from '../screens/SavedScreen';
import ContactScreen from '../screens/ContactScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FeaturedScreen from '../screens/FeaturedScreen';
import GstScreen from '../screens/GstScreen';
import BankScreen from '../screens/BankScreen';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminRates from '../screens/admin/AdminRates';
import AdminCarousel from '../screens/admin/AdminCarousel';
import AdminProducts from '../screens/admin/AdminProducts';
import AdminContact from '../screens/admin/AdminContact';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator({ isAdmin }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#110F0A', 
          borderTopWidth: 0, 
          elevation: 0, // Remove shadow on Android
          height: Platform.OS === 'ios' ? 85 : 65, // Provide enough space for safe areas
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#F5B041',
        tabBarInactiveTintColor: '#9C9281',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HOME') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'SHOP') iconName = focused ? 'bag' : 'bag-outline';
          else if (route.name === 'SAVED') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'CONTACT') iconName = focused ? 'help-buoy' : 'help-buoy-outline';
          else if (route.name === 'ACCOUNT') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'ADMIN') iconName = focused ? 'settings' : 'settings-outline';
          
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HOME" component={HomeScreen} />
      <Tab.Screen name="SHOP" component={ShopScreen} />
      <Tab.Screen name="SAVED" component={SavedScreen} />
      {isAdmin ? (
        <Tab.Screen name="ADMIN" component={AdminDashboard} />
      ) : (
        <Tab.Screen name="CONTACT" component={ContactScreen} />
      )}
      <Tab.Screen name="ACCOUNT" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let profileUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth(), (currentUser) => {
      setUser(currentUser);
      
      // Clear previous database listener if user changes
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (currentUser) {
        // 🔄 Real-time Database Listener for Profile
        const userRef = database().ref('Users/' + currentUser.uid);
        
        const onValueChange = userRef.on('value', (snapshot) => {
          if (snapshot.exists()) {
            setHasProfile(true);
            setIsAdmin(snapshot.val().role === 'admin');
          } else {
            setHasProfile(false);
            setIsAdmin(false);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Database listener error:", error);
          setIsLoading(false);
        });

        profileUnsubscribe = () => userRef.off('value', onValueChange);
      } else {
        setHasProfile(false);
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (showSplash || isLoading) {
    return <WelcomeScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#110F0A' } }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !hasProfile ? (
          <Stack.Screen name="FinishProfile" component={FinishProfileScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs">
              {props => <TabNavigator {...props} isAdmin={isAdmin} />}
            </Stack.Screen>
            <Stack.Screen name="Featured" component={FeaturedScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="Gst" component={GstScreen} />
            <Stack.Screen name="Bank" component={BankScreen} />
            
            {/* Admin Stack */}
            <Stack.Screen name="AdminRates" component={AdminRates} />
            <Stack.Screen name="AdminCarousel" component={AdminCarousel} />
            <Stack.Screen name="AdminProducts" component={AdminProducts} />
            <Stack.Screen name="AdminContact" component={AdminContact} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
