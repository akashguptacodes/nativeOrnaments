import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

export default function FinishProfileScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [firmName, setFirmName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');

  React.useEffect(() => {
    const user = auth().currentUser;
    if (user?.email) setEmail(user.email);
  }, []);

  const handleFinishProfile = async () => {
    if (!firmName || !address || !email) {
      setErrorMessage('All fields are required');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Authentication lost. Please try again.');

      await database().ref('Users/' + user.uid).set({
        'Firm Name': firmName.trim(),
        'Address': address.trim(),
        'Contact': user.phoneNumber || '',
        'Email': email.trim() || user.email || '',
        'role': 'user',
        'createdAt': Date.now(),
        'provider': user.providerData[0]?.providerId || 'phone'
      });

      console.log('✅ Profile created successfully!');
      // Navigation will be handled by AppNavigator observing the database change or by simple state update
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
          <Text style={styles.subtitle}>Complete Your Profile</Text>
          <Text style={styles.title}>OM ORNAMENTS</Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.stepContainer}>
            <Text style={styles.stepDesc}>Please provide your business details to continue.</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#9C9281" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Firm Name" 
                placeholderTextColor="#9C9281" 
                value={firmName} 
                onChangeText={setFirmName} 
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#9C9281" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Address" 
                placeholderTextColor="#9C9281" 
                value={address} 
                onChangeText={setAddress} 
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9C9281" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Email" 
                placeholderTextColor="#9C9281" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleFinishProfile} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="black" /> : <Text style={styles.buttonText}>GET STARTED</Text>}
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
  card: { width: '100%', maxWidth: 400, alignItems: 'center' },
  subtitle: { color: '#9C9281', fontSize: 14, letterSpacing: 2, marginBottom: 5 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', letterSpacing: 4, marginBottom: 30 },
  stepContainer: { width: '100%', alignItems: 'center' },
  stepDesc: { color: '#9C9281', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#1F1A12', borderRadius: 8, borderWidth: 1, borderColor: '#332A1D', marginBottom: 15 },
  inputIcon: { paddingHorizontal: 15 },
  input: { flex: 1, paddingVertical: 15, color: 'white', fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 15, textAlign: 'center' },
  button: { backgroundColor: '#F5B041', paddingVertical: 15, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 10 },
  buttonText: { fontWeight: 'bold', color: 'black', fontSize: 14, letterSpacing: 1 },
});
