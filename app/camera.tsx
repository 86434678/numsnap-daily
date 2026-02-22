
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function CameraScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertModal({ visible: true, title, message });
  };

  const hideAlert = () => {
    setAlertModal({ visible: false, title: '', message: '' });
  };

  console.log('CameraScreen: Component mounted');

  const requestPermissions = useCallback(async () => {
    console.log('CameraScreen: Requesting camera and location permissions');
    
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    setHasPermission(cameraStatus.granted);
    
    const locationStatus = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(locationStatus.granted);
    
    if (!cameraStatus.granted) {
      console.log('CameraScreen: Camera permission denied');
      showAlert('Permission Required', 'Camera access is required to take photos.');
    }
    
    if (!locationStatus.granted) {
      console.log('CameraScreen: Location permission denied');
      showAlert('Permission Required', 'Location access is required for entry verification.');
    }
  }, []);

  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  const capturePhoto = async () => {
    console.log('CameraScreen: User tapped Take Photo button');
    
    if (!hasPermission) {
      showAlert('Permission Required', 'Please grant camera permission to continue.');
      return;
    }
    
    if (!locationPermission) {
      showAlert('Permission Required', 'Please grant location permission to continue.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('CameraScreen: Getting current location');
      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      console.log('CameraScreen: Location obtained:', latitude, longitude);

      console.log('CameraScreen: Launching camera');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('CameraScreen: Photo captured, navigating to confirmation');
        const photoUri = result.assets[0].uri;
        
        router.push({
          pathname: '/confirm-submission',
          params: {
            photoUri,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          },
        });
      } else {
        console.log('CameraScreen: Photo capture cancelled');
      }
    } catch (error) {
      console.error('CameraScreen: Error capturing photo:', error);
      showAlert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null || locationPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]}>
      <Modal
        visible={alertModal.visible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{alertModal.title}</Text>
            <Text style={styles.modalMessage}>{alertModal.message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={hideAlert}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <IconSymbol 
            ios_icon_name="camera.fill" 
            android_material_icon_name="photo-camera" 
            size={80} 
            color={colors.primary} 
          />
        </View>
        
        <Text style={styles.title}>Snap a Number</Text>
        <Text style={styles.subtitle}>
          Take a photo of any number you find in the real world
        </Text>
        
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>Examples:</Text>
          <Text style={styles.exampleText}>• House numbers</Text>
          <Text style={styles.exampleText}>• License plates</Text>
          <Text style={styles.exampleText}>• Receipt totals</Text>
          <Text style={styles.exampleText}>• Street signs</Text>
          <Text style={styles.exampleText}>• Product barcodes</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={capturePhoto}
            disabled={loading || !hasPermission || !locationPermission}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol 
                  ios_icon_name="camera.fill" 
                  android_material_icon_name="photo-camera" 
                  size={24} 
                  color="#FFFFFF" 
                />
                <Text style={styles.buttonText}>Take Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {(!hasPermission || !locationPermission) && (
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  examplesContainer: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 20,
    marginBottom: 40,
    width: '100%',
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  exampleText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  permissionButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.error,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
