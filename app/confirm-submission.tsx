
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { authenticatedPost, authenticatedUpload } from '@/utils/api';

export default function ConfirmSubmissionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const photoUri = params.photoUri as string;
  const latitude = parseFloat(params.latitude as string);
  const longitude = parseFloat(params.longitude as string);
  
  const [detectedNumber, setDetectedNumber] = useState<string>('');
  const [confirmedNumber, setConfirmedNumber] = useState<string>('');
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  console.log('ConfirmSubmissionScreen: Photo URI:', photoUri);
  console.log('ConfirmSubmissionScreen: Location:', latitude, longitude);

  const processOCR = useCallback(async () => {
    console.log('[API] Starting OCR process for photo:', photoUri);
    setLoading(true);
    
    try {
      console.log('[API] Uploading photo to /api/upload-photo...');
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        formData.append('photo', blob, 'photo.jpg');
      } else {
        formData.append('photo', {
          uri: photoUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);
      }

      const uploadResult = await authenticatedUpload<{ photoUrl: string }>(
        '/api/upload-photo',
        formData
      );
      console.log('[API] /api/upload-photo response:', uploadResult);
      const uploadedPhotoUrl = uploadResult.photoUrl;

      setUploadedPhotoUrl(uploadedPhotoUrl);

      console.log('[API] Requesting /api/process-ocr...');
      const ocrResult = await authenticatedPost<{ detectedNumber: number | null }>(
        '/api/process-ocr',
        { photoUrl: uploadedPhotoUrl }
      );
      console.log('[API] /api/process-ocr response:', ocrResult);

      if (ocrResult.detectedNumber !== null && ocrResult.detectedNumber !== undefined) {
        const detectedStr = String(ocrResult.detectedNumber);
        setDetectedNumber(detectedStr);
        setConfirmedNumber(detectedStr);
        console.log('ConfirmSubmissionScreen: OCR detected number:', detectedStr);
      } else {
        console.log('ConfirmSubmissionScreen: OCR could not detect a number');
        setDetectedNumber('');
        setConfirmedNumber('');
      }
    } catch (error) {
      console.error('ConfirmSubmissionScreen: Error processing OCR:', error);
      setDetectedNumber('');
      setConfirmedNumber('');
    } finally {
      setLoading(false);
    }
  }, [photoUri]);

  useEffect(() => {
    processOCR();
  }, [processOCR]);

  const handleSubmit = async () => {
    console.log('ConfirmSubmissionScreen: User tapped Confirm & Submit button');
    
    if (!confirmedNumber || confirmedNumber.length === 0) {
      console.log('ConfirmSubmissionScreen: No number entered');
      setSubmitError('Please enter a number before submitting.');
      setShowErrorModal(true);
      return;
    }

    if (!uploadedPhotoUrl) {
      console.log('ConfirmSubmissionScreen: No uploaded photo URL available');
      setSubmitError('Photo upload is still in progress. Please wait.');
      setShowErrorModal(true);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    
    try {
      console.log('[API] Requesting /api/submit-entry...');
      const result = await authenticatedPost<{
        success: boolean;
        submission: { id: string; confirmedNumber: number; isWinner: boolean };
        revealData: { isMatch: boolean; userNumber: number; targetNumber: string; submissionTime: string; userName: string };
      }>('/api/submit-entry', {
        photoUrl: uploadedPhotoUrl,
        detectedNumber: detectedNumber ? parseInt(detectedNumber, 10) : parseInt(confirmedNumber, 10),
        confirmedNumber: parseInt(confirmedNumber, 10),
        latitude,
        longitude,
      });

      console.log('[API] /api/submit-entry response:', result);

      if (result.success) {
        console.log('ConfirmSubmissionScreen: Entry submitted successfully, navigating to reveal screen');
        if (result.revealData) {
          router.replace({
            pathname: '/reveal-result',
            params: {
              isMatch: result.revealData.isMatch ? 'true' : 'false',
              userNumber: String(result.revealData.userNumber),
              targetNumber: result.revealData.targetNumber,
              submissionTime: result.revealData.submissionTime,
              userName: result.revealData.userName,
            },
          });
        } else {
          router.replace('/reveal-result');
        }
      } else {
        setSubmitError('Submission failed. Please try again.');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('ConfirmSubmissionScreen: Error submitting entry:', error);
      const rawMessage = error?.message || 'Failed to submit entry. Please try again.';
      
      // Parse the error message from the API response body if present
      // API errors come as: "API error: 400 - {"error":"..."}"
      let parsedMessage = rawMessage;
      try {
        const jsonMatch = rawMessage.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error) {
            parsedMessage = parsed.error;
          }
        }
      } catch {
        // Use raw message if JSON parsing fails
      }

      if (
        parsedMessage.includes('continental United States') ||
        parsedMessage.includes('outside the eligible area') ||
        parsedMessage.includes('eligible area')
      ) {
        setSubmitError('Submissions are only accepted from the continental United States. Your location is outside the eligible area.');
      } else if (
        parsedMessage.includes('already submitted') ||
        parsedMessage.includes('one submission') ||
        parsedMessage.includes('already have a submission')
      ) {
        setSubmitError('You have already submitted an entry today. Come back tomorrow!');
      } else {
        setSubmitError(parsedMessage);
      }
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNumberChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    const truncated = numericOnly.slice(0, 6);
    setConfirmedNumber(truncated);
    console.log('ConfirmSubmissionScreen: Number changed to:', truncated);
  };

  const hideErrorModal = () => {
    setShowErrorModal(false);
  };

  const confirmedNumberDisplay = confirmedNumber.padStart(6, '0');

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]}>
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={hideErrorModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol 
              ios_icon_name="exclamationmark.circle.fill" 
              android_material_icon_name="error" 
              size={48} 
              color={colors.error} 
            />
            <Text style={styles.modalTitle}>Submission Error</Text>
            <Text style={styles.modalMessage}>{submitError}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={hideErrorModal}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Detecting number...</Text>
          </View>
        ) : (
          <>
            <View style={styles.detectionCard}>
              <Text style={styles.detectionLabel}>Detected Number:</Text>
              <View style={styles.detectedNumberContainer}>
                <Text style={styles.detectedNumber}>{detectedNumber || 'None'}</Text>
              </View>
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Confirm or Edit Number:</Text>
              <TextInput
                style={styles.input}
                value={confirmedNumber}
                onChangeText={handleNumberChange}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="Enter 6-digit number"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.inputHint}>
                Is this the correct number from your photo?
              </Text>
            </View>

            <View style={styles.displayCard}>
              <Text style={styles.displayLabel}>Your Entry:</Text>
              <View style={styles.displayNumberContainer}>
                <Text style={styles.displayNumber}>{confirmedNumberDisplay}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, (!confirmedNumber || submitting) && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={!confirmedNumber || submitting}
            >
              <LinearGradient
                colors={confirmedNumber && !submitting ? [colors.success, '#00CC66'] : ['#CCCCCC', '#999999']}
                style={styles.submitButtonGradient}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol 
                      ios_icon_name="checkmark.circle.fill" 
                      android_material_icon_name="check-circle" 
                      size={24} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.submitButtonText}>Confirm & Submit</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.locationCard}>
              <IconSymbol 
                ios_icon_name="location.fill" 
                android_material_icon_name="location-on" 
                size={20} 
                color={colors.textSecondary} 
              />
              <Text style={styles.locationText}>
                Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  photoContainer: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: colors.card,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.textSecondary,
  },
  detectionCard: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  detectionLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  detectedNumberContainer: {
    backgroundColor: 'rgba(0, 255, 127, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  detectedNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.success,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputCard: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  displayCard: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  displayLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  displayNumberContainer: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  displayNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  submitButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 15,
    backgroundColor: colors.card,
    borderRadius: 10,
  },
  locationText: {
    fontSize: 12,
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
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
