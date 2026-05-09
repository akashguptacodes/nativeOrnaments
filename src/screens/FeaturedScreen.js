import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function FeaturedScreen({ route, navigation }) {
  const items = route.params?.items || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>FEATURED PIECES</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {items.map((item) => (
            <View key={item.id} style={styles.productCard}>
              <View style={styles.productImgContainer}>
                <Image source={item.img} style={styles.productImg} />
              </View>
              <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.productPrice}>{item.price}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30, marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { width: '48%', marginBottom: 20 },
  productImgContainer: { width: '100%', height: 200, backgroundColor: '#1F1A12', borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  productImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  productTitle: { color: 'white', fontSize: 14, marginBottom: 5 },
  productPrice: { color: '#F5B041', fontSize: 16, fontWeight: 'bold' },
});
