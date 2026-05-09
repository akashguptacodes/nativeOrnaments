import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, PhoneAuthProvider, signInWithCredential, GoogleAuthProvider, signInWithPhoneNumber } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database, firebaseConfig } from '../config/firebase';
import { RNRecaptcha, FirebaseApplicationVerifier } from '../utils/RNRecaptcha';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In with the Web Client ID
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '407760094478-eem62shnhd4ctg7hdjhhs2b8krrp29r6.apps.googleusercontent.com',
});

export default function SignupScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1: Phone
  const [phone, setPhone] = useState('+91');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Step 2: OTP
  const [otp, setOtp] = useState('');

  // WebView reCAPTCHA modal ref
  const recaptchaRef = useRef(null);

  // Step 3: Profile
  const [firmName, setFirmName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscureText, setObscureText] = useState(true);

  // --- Native Google Sign-In ---
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      if (!idToken) {
        throw new Error('Failed to get ID token from Google');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      
      const { get } = require('firebase/database');
      const userRef = ref(database, 'Users/' + user.uid);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, {
          'Firm Name': user.displayName || 'Google User',
          'Address': '',
          'Contact': '',
          'Email': user.email || '',
          'createdAt': Date.now()
        });
      }
    } catch (error) {
      console.log('Google Sign-In Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — do nothing
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMessage('Google Play Services not available.');
      } else {
        setErrorMessage(error.message || 'Google sign-in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- PRODUCTION PHONE AUTH FLOW ---
  const handleSendOTP = async () => {
    if (phone.length < 10) {
      setErrorMessage('Please enter a valid phone number with country code.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      console.log('📱 Starting OTP flow...');
      console.log('📱 Sending OTP to:', phone);
      
      console.log('🔄 Opening reCAPTCHA modal...');
      const token = await recaptchaRef.current.open();
      
      if (!token) {
        throw new Error('Failed to solve reCAPTCHA');
      }
      
      // Step 2: Use the perfectly shaped wrapper that guarantees a Promise
      const verifier = new FirebaseApplicationVerifier(token);

      console.log('🔄 Calling signInWithPhoneNumber...');
      const confResult = await signInWithPhoneNumber(auth, phone, verifier);
      console.log('✅ OTP sent successfully, confirmation result:', confResult);
      setConfirmationResult(confResult);
      setStep(2);
    } catch (error) {
      console.error('❌ Phone auth error:', error);
      
      let friendlyMessage = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/invalid-phone-number') {
        friendlyMessage = 'Invalid phone number format. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        friendlyMessage = 'Network error. Please check your internet connection.';
      }
      
      setErrorMessage(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      setErrorMessage('Please enter a valid 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      console.log('🔐 Verifying OTP:', otp);
      if (confirmationResult) {
        console.log('✅ Confirmation result exists, confirming OTP...');
        await confirmationResult.confirm(otp);
        console.log('✅ OTP verified successfully');
        setStep(3);
      } else {
        console.error('❌ No confirmation result found');
        throw new Error('No confirmation result found. Please resend OTP.');
      }
    } catch (error) {
      console.error('❌ OTP Verify Error:', error);
      
      let friendlyMessage = 'Invalid OTP. Please check the code and try again.';
      if (error.code === 'auth/invalid-verification-code') {
        friendlyMessage = 'The OTP entered is incorrect.';
      } else if (error.code === 'auth/code-expired') {
        friendlyMessage = 'The OTP has expired. Please request a new one.';
      } else if (error.code === 'auth/network-request-failed') {
        friendlyMessage = 'Network error. Please check your internet connection.';
      }
      
      setErrorMessage(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSignup = async () => {
    if (!firmName || !address || !email || !password) {
      setErrorMessage('All fields are required');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // If we signed in with phone credential above, auth.currentUser is not null.
      // We can update the current user or simply create a new Email/Password credential.
      // To strictly follow "login by email and password", we create an Email/Password account.
      // Note: if signed in with phone, creating a new user will sign out the phone user and sign in the new one.
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await set(ref(database, 'Users/' + user.uid), {
        'Firm Name': firmName.trim(),
        'Address': address.trim(),
        'Contact': phone.trim(),
        'Email': email.trim(),
        'createdAt': Date.now()
      });

      // User is automatically logged in by Firebase with Email/Password
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.subtitle}>Create Account</Text>
          <Text style={styles.title}>OM ORNAMENTS</Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepDesc}>Enter your phone number to get started.</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#9C9281" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (e.g. +91...)"
                  placeholderTextColor="#9C9281"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              {isLoading ? (
                <ActivityIndicator size="large" color="#F5B041" style={{ marginVertical: 10 }} />
              ) : (
                <>
                  <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
                    <Text style={styles.buttonText}>SEND OTP</Text>
                  </TouchableOpacity>

                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.divider} />
                  </View>

                  <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn}>
                    <Ionicons name="logo-google" size={20} color="white" style={{ marginRight: 10 }} />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepDesc}>Enter the 6-digit OTP sent to {phone}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="chatbubbles-outline" size={20} color="#9C9281" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor="#9C9281"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              {isLoading ? (
                <ActivityIndicator size="large" color="#F5B041" style={{ marginVertical: 20 }} />
              ) : (
                <TouchableOpacity style={styles.button} onPress={handleVerifyOTP}>
                  <Text style={styles.buttonText}>VERIFY OTP</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={styles.forgotText}>Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepDesc}>Complete your profile details.</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#9C9281" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Firm Name" placeholderTextColor="#9C9281" value={firmName} onChangeText={setFirmName} />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#9C9281" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Address" placeholderTextColor="#9C9281" value={address} onChangeText={setAddress} />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9C9281" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9C9281" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9C9281" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9C9281" value={password} onChangeText={setPassword} secureTextEntry={obscureText} />
                <TouchableOpacity onPress={() => setObscureText(!obscureText)} style={styles.eyeButton}>
                  <Ionicons name={obscureText ? "eye-off-outline" : "eye-outline"} size={20} color="#9C9281" />
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color="#F5B041" style={{ marginVertical: 20 }} />
              ) : (
                <TouchableOpacity style={styles.button} onPress={handleFinalSignup}>
                  <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={[styles.footerRow, { marginTop: step === 3 ? 10 : 30 }]}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Official Stable reCAPTCHA Modal */}
      <RNRecaptcha 
        ref={recaptchaRef} 
        firebaseConfig={firebaseConfig} 
      />
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
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', letterSpacing: 4, marginBottom: 30 },

  stepContainer: { width: '100%', alignItems: 'center' },
  stepDesc: { color: '#9C9281', fontSize: 14, marginBottom: 20, textAlign: 'center' },

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
    fontSize: 14,
  },
  eyeButton: { padding: 15 },

  forgotText: { color: '#F5B041', fontSize: 12, fontWeight: 'bold', marginTop: 10 },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 15, textAlign: 'center' },

  button: {
    backgroundColor: '#F5B041',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { fontWeight: 'bold', color: 'black', fontSize: 14, letterSpacing: 1 },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#332A1D' },
  dividerText: { color: '#9C9281', paddingHorizontal: 10, fontSize: 12 },

  googleBtn: {
    flexDirection: 'row',
    backgroundColor: '#EA4335',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: { fontWeight: 'bold', color: 'white', fontSize: 14, letterSpacing: 1 },

  footerRow: { flexDirection: 'row', alignItems: 'center' },
  footerText: { color: '#9C9281', fontSize: 14 },
  linkText: { color: '#F5B041', fontSize: 14, fontWeight: 'bold' },
});
