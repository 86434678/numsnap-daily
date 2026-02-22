
import React, { useState, useEffect } from 'react';
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
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
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

  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      console.log('CameraScreen: Checking permissions');
      setIsCheckingPermissions(true);
      
      try {
        // Check current permissions first
        const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
        const locationPermissionStatus = await Location.getForegroundPermissionsAsync();
        
        console.log('CameraScreen: Current camera permission:', cameraPermission.status);
        console.log('CameraScreen: Current location permission:', locationPermissionStatus.status);
        
        // If not granted, request them
        if (cameraPermission.status !== 'granted') {
          console.log('CameraScreen: Requesting camera permission');
          const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
          console.log('CameraScreen: Camera permission result:', cameraResult.status);
          setHasPermission(cameraResult.granted);
          
          if (!cameraResult.granted) {
            showAlert('Permission Required', 'Camera access is required to take photos. Please enable it in your device settings.');
          }
        } else {
          setHasPermission(true);
        }
        
        if (locationPermissionStatus.status !== 'granted') {
          console.log('CameraScreen: Requesting location permission');
          const locationResult = await Location.requestForegroundPermissionsAsync();
          console.log('CameraScreen: Location permission result:', locationResult.status);
          setLocationPermission(locationResult.granted);
          
          if (!locationResult.granted) {
            showAlert('Permission Required', 'Location access is required for entry verification. Please enable it in your device settings.');
          }
        } else {
          setLocationPermission(true);
        }
      } catch (error) {
        console.error('CameraScreen: Error checking permissions:', error);
        setHasPermission(false);
        setLocationPermission(false);
        showAlert('Error', 'Failed to check permissions. Please try again.');
      } finally {
        setIsCheckingPermissions(false);
        console.log('CameraScreen: Permission check complete');
      }
    };

    checkAndRequestPermissions();
  }, []);

  const requestPermissionsAgain = async () => {
    console.log('CameraScreen: User tapped Grant Permissions button');
    setIsCheckingPermissions(true);
    
    try {
      console.log('CameraScreen: Requesting camera permission');
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('CameraScreen: Camera permission result:', cameraResult.status);
      setHasPermission(cameraResult.granted);
      
      if (!cameraResult.granted) {
        showAlert('Permission Required', 'Camera access is required. Please enable it in your device settings.');
      }
      
      console.log('CameraScreen: Requesting location permission');
      const locationResult = await Location.requestForegroundPermissionsAsync();
      console.log('CameraScreen: Location permission result:', locationResult.status);
      setLocationPermission(locationResult.granted);
      
      if (!locationResult.granted) {
        showAlert('Permission Required', 'Location access is required. Please enable it in your device settings.');
      }
    } catch (error) {
      console.error('CameraScreen: Error requesting permissions:', error);
      showAlert('Error', 'Failed to request permissions. Please try again.');
    } finally {
      setIsCheckingPermissions(false);
    }
  };

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

  if (isCheckingPermissions) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  const bothPermissionsGranted = hasPermission && locationPermission;
  const permissionStatusText = !hasPermission 
    ? 'Camera permission is required' 
    : !locationPermission 
    ? 'Location permission is required' 
    : '';

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

        {!bothPermissionsGranted && (
          <View style={styles.warningContainer}>
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="warning" 
              size={24} 
              color={colors.error} 
            />
            <Text style={styles.warningText}>{permissionStatusText}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {bothPermissionsGranted ? (
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={capturePhoto}
              disabled={loading}
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
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.permissionButton]} 
              onPress={requestPermissionsAgain}
              disabled={isCheckingPermissions}
            >
              {isCheckingPermissions ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol 
                    ios_icon_name="lock.open.fill" 
                    android_material_icon_name="lock-open" 
                    size={24} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.buttonText}>Grant Permissions</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
    marginBottom: 30,
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
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
  permissionButton: {
    backgroundColor: colors.error,
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
