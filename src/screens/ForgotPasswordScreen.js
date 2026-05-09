import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setMessage('Email is required');
      setIsError(true);
      return;
    }
    setIsLoading(true);
    setMessage('');
    
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('Password reset email sent!');
      setIsError(false);
    } catch (error) {
      setMessage(error.message || 'An error occurred');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ImageBackground source={require('../assets/image/background.png')} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <BlurView intensity={50} tint="light" style={styles.blurContainer}>
            <View style={styles.card}>
              <Text style={styles.title}>Forgot Password</Text>
              
              <Text style={styles.instruction}>Enter your email to reset your password</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="gray"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {message ? (
                <Text style={[styles.messageText, { color: isError ? 'red' : 'green' }]}>
                  {message}
                </Text>
              ) : null}

              {isLoading ? (
                <ActivityIndicator size="large" color="black" style={{ marginVertical: 10 }} />
              ) : (
                <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                  <Text style={styles.buttonText}>Reset Password</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  background: { flex: 1, resizeMode: 'cover' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 25 },
  blurContainer: { borderRadius: 10, overflow: 'hidden' },
  card: {
    width: 350,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  title: { fontSize: 30, fontWeight: 'bold', color: 'orange', marginBottom: 20 },
  instruction: { color: 'white', textAlign: 'center', marginBottom: 20 },
  input: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    color: 'black',
  },
  messageText: { fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  button: {
    backgroundColor: 'orange',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { fontWeight: 'bold', color: '#272626', fontSize: 16 },
  linkText: { color: 'white', marginTop: 10 },
});
