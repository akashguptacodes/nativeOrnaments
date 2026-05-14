import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default function LoginScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleNewUser, setIsGoogleNewUser] = useState(false);

  // 🔄 Unified Sync Logic
  const syncUserData = async (user, identifierType, identifierValue) => {
    try {
      const userRef = database().ref('Users/' + user.uid);
      const snapshot = await userRef.once('value');

      // 1. If profile data already exists for this UID
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Ensure role exists
        if (!data.role) await userRef.update({ role: 'user' });
        return true; 
      }

      // 2. Search for existing records by identifier (Email or Contact)
      const existingSnapshot = await database()
        .ref('Users')
        .orderByChild(identifierType)
        .equalTo(identifierValue)
        .once('value');

      if (existingSnapshot.exists()) {
        const data = existingSnapshot.val();
        const existingUid = Object.keys(data)[0];
        const userData = data[existingUid];

        if (existingUid !== user.uid) {
          // Migrate Data
          await userRef.set({
            ...userData,
            role: userData.role || 'user',
            lastLogin: Date.now(),
            provider: user.providerData[0]?.providerId || 'google'
          });

          // Migrate Wishlist/Recent
          const wishSnapshot = await database().ref('wishlist/' + existingUid).once('value');
          if (wishSnapshot.exists()) await database().ref('wishlist/' + user.uid).update(wishSnapshot.val());
          
          const recentSnapshot = await database().ref('recentViews/' + existingUid).once('value');
          if (recentSnapshot.exists()) await database().ref('recentViews/' + user.uid).update(recentSnapshot.val());
        }
        return true; 
      }
      
      return false; 
    } catch (err) {
      console.error('Data Sync Error:', err);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      const credential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(credential);
      
      // Check if user exists
      const exists = await syncUserData(userCredential.user, 'Email', userCredential.user.email);
      
      if (!exists) {
        // New Google user: Ask for phone verification first
        setIsGoogleNewUser(true);
        setStep(1); // Ensure we are on phone input step
        Alert.alert("One More Step", "To complete your registration, please verify your phone number.");
      }
    } catch (error) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        setErrorMessage(error.message || 'Google sign-in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }
    setIsLoading(true);
    try {
      const confirm = await auth().signInWithPhoneNumber(phone);
      setConfirmation(confirm);
      setStep(2);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      setErrorMessage('Please enter 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    try {
      if (isGoogleNewUser) {
        // Link Phone to existing Google Session or just sync data
        const user = auth().currentUser;
        // Verify the phone via confirmation
        const credential = auth.PhoneAuthProvider.credential(confirmation.verificationId, otp);
        await user.linkWithCredential(credential);
        
        // Now check if a profile exists for this phone number
        await syncUserData(user, 'Contact', phone);
      } else {
        const userCredential = await confirmation.confirm(otp);
        await syncUserData(userCredential.user, 'Contact', phone);
      }
      await AsyncStorage.setItem('userPhone', phone);
    } catch (error) {
      setErrorMessage(error.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require('../../assets/logo_om.png')} style={styles.logo} />
          <Text style={styles.title}>{isGoogleNewUser ? 'Verify Phone' : 'Welcome to'}</Text>
          <Text style={styles.brandTitle}>OM ORNAMENTS</Text>
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <Text style={styles.label}>Enter your phone number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9C9281" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+91..."
                placeholderTextColor="#9C9281"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity style={styles.loginBtn} onPress={handleSendOTP} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="black" /> : <Text style={styles.loginBtnText}>SEND OTP</Text>}
            </TouchableOpacity>

            {!isGoogleNewUser && (
              <>
                <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>
                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={isLoading}>
                  <Ionicons name="logo-google" size={20} color="white" style={{ marginRight: 10 }} />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.infoText}>OTP sent to {phone}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9C9281" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#9C9281"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <TouchableOpacity style={styles.loginBtn} onPress={handleVerifyOTP} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="black" /> : <Text style={styles.loginBtnText}>VERIFY & PROCEED</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Change Phone Number</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 25, alignItems: 'center' },
  header: { marginBottom: 30, width: '100%', alignItems: 'center' },
  logo: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 10 },
  title: { color: 'white', fontSize: 24, fontWeight: '300' },
  brandTitle: { color: '#F5B041', fontSize: 36, fontWeight: 'bold', letterSpacing: 2 },
  form: { width: '100%', alignItems: 'center' },
  label: { color: '#9C9281', alignSelf: 'flex-start', marginBottom: 10, fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F1A12', borderRadius: 8, marginBottom: 15, width: '100%', borderWidth: 1, borderColor: '#332A1D' },
  inputIcon: { paddingHorizontal: 15 },
  input: { flex: 1, paddingVertical: 15, color: 'white', fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 15, textAlign: 'center' },
  loginBtn: { backgroundColor: '#F5B041', paddingVertical: 15, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: 'black', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#332A1D' },
  dividerText: { color: '#9C9281', paddingHorizontal: 10, fontSize: 12 },
  googleBtn: { flexDirection: 'row', backgroundColor: '#EA4335', paddingVertical: 15, borderRadius: 8, width: '100%', alignItems: 'center', justifyContent: 'center' },
  googleBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  infoText: { color: '#9C9281', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  backBtn: { marginTop: 20, alignSelf: 'center' },
  backBtnText: { color: '#9C9281', fontSize: 14, textDecorationLine: 'underline' }
});
