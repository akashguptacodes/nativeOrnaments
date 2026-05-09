import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscureText, setObscureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Email and Password are required');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      await AsyncStorage.setItem('userEmail', email.trim());
    } catch (error) {
      setErrorMessage(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Try again.';
      case 'auth/invalid-email':
        return 'Invalid email format.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.subtitle}>Welcome Back</Text>
          <Text style={styles.title}>ADORNIA</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#9C9281" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#9C9281"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#9C9281" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9C9281"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={obscureText}
            />
            <TouchableOpacity onPress={() => setObscureText(!obscureText)} style={styles.eyeButton}>
              <Ionicons name={obscureText ? "eye-off-outline" : "eye-outline"} size={20} color="#9C9281" />
            </TouchableOpacity>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {isLoading ? (
            <ActivityIndicator size="large" color="#F5B041" style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>LOGIN</Text>
            </TouchableOpacity>
          )}

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 25 },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    alignItems: 'center',
  },
  subtitle: { color: '#9C9281', fontSize: 14, letterSpacing: 2, marginBottom: 5 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', letterSpacing: 4, marginBottom: 40 },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#1F1A12',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#332A1D',
    marginBottom: 15,
  },
  inputIcon: { paddingHorizontal: 15 },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: 'white',
    fontSize: 16,
  },
  eyeButton: { padding: 15 },
  
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { color: '#F5B041', fontSize: 12, fontWeight: 'bold' },
  
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 15, textAlign: 'center' },
  
  button: {
    backgroundColor: '#F5B041',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: { fontWeight: 'bold', color: 'black', fontSize: 14, letterSpacing: 1 },
  
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  footerText: { color: '#9C9281', fontSize: 14 },
  linkText: { color: '#F5B041', fontSize: 14, fontWeight: 'bold' },
});
