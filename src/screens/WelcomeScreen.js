import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image 
          source={require('../../assets/logo_om.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </Animated.View>
      
      <Animated.View style={[styles.taglineBox, { opacity: fadeAnim }]}>
        <Text style={styles.tagline}>Designed and developed by Multiqo</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#110F0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: width * 0.8,
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  taglineBox: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  tagline: {
    color: '#9C9281',
    fontSize: 12,
    letterSpacing: 1,
    fontStyle: 'italic'
  }
});
