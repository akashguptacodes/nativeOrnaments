import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import SavedScreen from '../screens/SavedScreen';
import ContactScreen from '../screens/ContactScreen';
import FeaturedScreen from '../screens/FeaturedScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#110F0A', borderTopWidth: 0, paddingBottom: 5, paddingTop: 5, height: 60 },
        tabBarActiveTintColor: '#F5B041',
        tabBarInactiveTintColor: '#9C9281',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HOME') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'SHOP') iconName = focused ? 'bag' : 'bag-outline';
          else if (route.name === 'SAVED') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'ACCOUNT') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HOME" component={HomeScreen} />
      <Tab.Screen name="SHOP" component={ShopScreen} />
      <Tab.Screen name="SAVED" component={SavedScreen} />
      <Tab.Screen name="ACCOUNT" component={ContactScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#110F0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F5B041" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#110F0A' } }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Featured" component={FeaturedScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
