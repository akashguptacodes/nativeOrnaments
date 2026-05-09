import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, PhoneAuthProvider, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { WebView } from 'react-native-webview';
import * as Google from 'expo-auth-session/providers/google';

export default function SignupScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1: Phone
  const [phone, setPhone] = useState('+91');
  const [verificationId, setVerificationId] = useState(null);

  // Step 2: OTP
  const [otp, setOtp] = useState('');
  const [showRecaptcha, setShowRecaptcha] = useState(false);
  const webViewRef = useRef(null);

  // Step 3: Profile
  const [firmName, setFirmName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscureText, setObscureText] = useState(true);

  // Google Auth
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'REPLACE_WITH_YOUR_WEB_CLIENT_ID',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setIsLoading(true);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          const userRef = ref(database, 'Users/' + user.uid);
          // Only create DB entry if it's a new user (or just overwrite empty ones)
          // We can just use set to ensure data exists, taking care not to overwrite existing full data if they login again.
          // For simplicity, we just set it here if they are "registering"
          await set(userRef, {
            'Firm Name': user.displayName || '',
            'Address': '',
            'Contact': '',
            'Email': user.email || '',
            'createdAt': Date.now()
          });
        })
        .catch((error) => {
          setErrorMessage(error.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [response]);

  // --- PRODUCTION PHONE AUTH FLOW ---
  const handleSendOTP = async () => {
    if (phone.length < 10) {
      setErrorMessage('Please enter a valid phone number with country code.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    setShowRecaptcha(true);
  };

  const onRecaptchaVerify = async (token) => {
    setShowRecaptcha(false);
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verifier = {
        type: 'recaptcha',
        verify: async () => token
      };
      const vId = await phoneProvider.verifyPhoneNumber(phone, verifier);
      setVerificationId(vId);
      setStep(2);
    } catch (error) {
      console.log('Phone auth error:', error);
      setErrorMessage(error.message);
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
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
      setStep(3);
    } catch (error) {
      console.log('OTP Verify Error:', error);
      setErrorMessage('Invalid OTP. Please check the code and try again.');
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
      {showRecaptcha && (
        <View style={StyleSheet.absoluteFill}>
          <WebView
            originWhitelist={['*']}
            source={{ html: `
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
                  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
                </head>
                <body style="background-color: #110F0A; display: flex; justify-content: center; align-items: center;">
                  <div id="recaptcha-container"></div>
                  <script>
                    firebase.initializeApp({
                      apiKey: "${process.env.EXPO_PUBLIC_FIREBASE_API_KEY}",
                      authDomain: "${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}"
                    });
                    const recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                      size: 'normal',
                      callback: (response) => {
                        window.ReactNativeWebView.postMessage(response);
                      }
                    });
                    recaptchaVerifier.render();
                  </script>
                </body>
              </html>
            ` }}
            onMessage={(event) => {
              onRecaptchaVerify(event.nativeEvent.data);
            }}
          />
          <TouchableOpacity 
            style={{ position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 5 }}
            onPress={() => setShowRecaptcha(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.subtitle}>Create Account</Text>
          <Text style={styles.title}>ADORNIA</Text>

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

                  <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} disabled={!request}>
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
