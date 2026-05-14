import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AdminDashboard({ navigation }) {
  const adminOptions = [
    { id: 'rates', title: 'Market Rates', icon: 'trending-up', screen: 'AdminRates', color: '#F5B041' },
    { id: 'carousel', title: 'Carousel Banners', icon: 'images', screen: 'AdminCarousel', color: '#3498DB' },
    { id: 'products', title: 'Manage Products', icon: 'diamond', screen: 'AdminProducts', color: '#9B59B6' },
    { id: 'contact', title: 'Business & Bank', icon: 'business', screen: 'AdminContact', color: '#2ECC71' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ADMIN PANEL</Text>
        <TouchableOpacity onPress={() => navigation.navigate('HOME')}>
          <Ionicons name="home-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeTitle}>Welcome, Admin</Text>
          <Text style={styles.welcomeSub}>Manage your jewelry store from here.</Text>
        </View>

        <View style={styles.grid}>
          {adminOptions.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card} 
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={30} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>Update & Edit</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#1F1A12' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  scrollContent: { padding: 20 },
  welcomeBox: { marginBottom: 30 },
  welcomeTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  welcomeSub: { color: '#9C9281', fontSize: 14, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: (width - 60) / 2, backgroundColor: '#1F1A12', borderRadius: 15, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#332A1D' },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  cardTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  cardSub: { color: '#9C9281', fontSize: 10, marginTop: 5 },
});
