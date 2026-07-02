import React from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function ProductModal({ visible, item, onClose }) {
  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={styles.blurBackground} />
        
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.imageContainer}>
            <Image source={item.img} style={styles.productImage} />
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.productTitle}>{item.title}</Text>
            
            <View style={styles.tagsRow}>
              {item.category && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.category.toUpperCase()}</Text>
                </View>
              )}
              {item.material && (
                <View style={[styles.tag, { backgroundColor: '#332A1D' }]}>
                  <Text style={[styles.tagText, { color: '#F5B041' }]}>{item.material}</Text>
                </View>
              )}
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Design</Text>
                <Text style={styles.infoValue}>Exclusive</Text>
              </View>
              {item.weight && (
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Weight</Text>
                  <Text style={styles.infoValue}>{item.weight}g</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <Text style={styles.actionButtonText}>Awesome</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#1F1A12',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#332A1D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.85,
    backgroundColor: '#110F0A',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
  },
  productTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  tagsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F5B041',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    marginRight: 10,
    marginBottom: 5,
  },
  tagText: {
    color: 'black',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#110F0A',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    color: '#9C9281',
    fontSize: 12,
    marginBottom: 5,
  },
  infoValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#F5B041',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
