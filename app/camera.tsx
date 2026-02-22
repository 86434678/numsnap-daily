
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

// Continental US geographic bounds
const CONTINENTAL_US_BOUNDS = {
  minLat: 24.0,
  maxLat: 49.5,
  minLon: -125.0,
  maxLon: -66.5,
};

/**
 * Check if a lat/lon coordinate is within the continental United States.
 * Excludes Alaska, Hawaii, territories, and international locations.
 */
function isInContinentalUS(latitude: number, longitude: number): boolean {
  return (
    latitude >= CONTINENTAL_US_BOUNDS.minLat &&
    latitude <= CONTINENTAL_US_BOUNDS.maxLat &&
    longitude >= CONTINENTAL_US_BOUNDS.minLon &&
    longitude <= CONTINENTAL_US_BOUNDS.maxLon
  );
}

export default function CameraScreen() {
  const router = useRouter();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string; showSettings?: boolean }>({
    visible: false,
    title: '',
    message: '',
    showSettings: false,
  });

  const showAlert = (title: string, message: string, showSettings = false) => {
    setAlertModal({ visible: true, title, message, showSettings });
  };

  const hideAlert = () => {
    setAlertModal({ visible: false, title: '', message: '', showSettings: false });
  };

  console.log('CameraScreen: Component mounted');

  useEffect(() => {
    const checkLocationPermission = async () => {
      console.log('CameraScreen: Checking location permission on mount');
      try {
        const locationPermissionStatus = await Location.getForegroundPermissionsAsync();
        console.log('CameraScreen: Current location permission:', locationPermissionStatus.status);
        setLocationPermission(locationPermissionStatus.granted);
      } catch (error) {
        console.error('CameraScreen: Error checking location permission:', error);
        setLocationPermission(false);
      }
    };

    checkLocationPermission();
  }, []);

  const requestLocationAndOpenCamera = async () => {
    console.log('CameraScreen: User tapped Take Photo button');
    
    // Step 1: Request location permission first
    setIsRequestingLocation(true);
    
    try {
      console.log('CameraScreen: Requesting location permission');
      const locationResult = await Location.requestForegroundPermissionsAsync();
      console.log('CameraScreen: Location permission result:', locationResult.status);
      
      if (!locationResult.granted) {
        console.log('CameraScreen: Location permission denied');
        setLocationPermission(false);
        setIsRequestingLocation(false);
        
        // Show alert with option to open settings
        showAlert(
          'Location Required',
          'You must share your location to participate. Please enable location access in your device settings.',
          true
        );
        return;
      }
      
      // Location permission granted
      console.log('CameraScreen: Location permission granted');
      setLocationPermission(true);
      
      // Step 2: Get current location
      console.log('CameraScreen: Getting current location');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      console.log('CameraScreen: Location obtained:', latitude, longitude);

      // Step 3: Geographic restriction check — continental US only
      console.log('CameraScreen: Checking geographic restriction for continental US');
      if (!isInContinentalUS(latitude, longitude)) {
        console.log('CameraScreen: Location outside continental US, blocking submission');
        setIsRequestingLocation(false);
        showAlert(
          'Location Not Eligible',
          'Submissions are only accepted from the continental United States. Your location is outside the eligible area.\n\nEntries from Alaska, Hawaii, U.S. territories, or outside the U.S. are not eligible.'
        );
        return;
      }
      console.log('CameraScreen: Location is within continental US, proceeding');
      
      setIsRequestingLocation(false);
      
      // Step 4: Now request camera permission and open camera
      console.log('CameraScreen: Requesting camera permission');
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('CameraScreen: Camera permission result:', cameraPermission.status);
      
      if (!cameraPermission.granted) {
        console.log('CameraScreen: Camera permission denied');
        showAlert(
          'Camera Required',
          'Camera access is required to take photos. Please enable it in your device settings.',
          true
        );
        return;
      }
      
      // Step 5: Open camera
      setIsCapturingPhoto(true);
      console.log('CameraScreen: Launching camera');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('CameraScreen: Photo captured successfully, navigating to confirmation');
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
        console.log('CameraScreen: Photo capture cancelled by user');
      }
    } catch (error) {
      console.error('CameraScreen: Error in photo capture flow:', error);
      showAlert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsRequestingLocation(false);
      setIsCapturingPhoto(false);
    }
  };

  const handleOpenSettings = () => {
    console.log('CameraScreen: User tapped Open Settings');
    hideAlert();
    Linking.openSettings();
  };

  const isLoading = isRequestingLocation || isCapturingPhoto;
  const loadingText = isRequestingLocation 
    ? 'Requesting location permission...' 
    : isCapturingPhoto 
    ? 'Opening camera...' 
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
            <View style={styles.modalButtonContainer}>
              {alertModal.showSettings && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonPrimary]} 
                  onPress={handleOpenSettings}
                >
                  <Text style={styles.modalButtonText}>Open Settings</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.modalButton, alertModal.showSettings ? styles.modalButtonSecondary : styles.modalButtonPrimary]} 
                onPress={hideAlert}
              >
                <Text style={[styles.modalButtonText, alertModal.showSettings && styles.modalButtonTextSecondary]}>
                  {alertModal.showSettings ? 'Cancel' : 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
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

        {locationPermission === false && !isLoading && (
          <View style={styles.warningContainer}>
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="warning" 
              size={24} 
              color={colors.error} 
            />
            <Text style={styles.warningText}>
              Location permission is required to participate
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={requestLocationAndOpenCamera}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.loadingButtonText}>{loadingText}</Text>
              </View>
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

        <View style={styles.infoContainer}>
          <IconSymbol 
            ios_icon_name="info.circle.fill" 
            android_material_icon_name="info" 
            size={20} 
            color={colors.textSecondary} 
          />
          <Text style={styles.infoText}>
            Location required · Continental US only · All times in PST
          </Text>
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
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonSecondary: {
    backgroundColor: '#E5E5EA',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#000',
  },
});
