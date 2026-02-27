
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { authenticatedPost, authenticatedUpload } from '@/utils/api';
import { performOCR, isOCRAvailable } from '@/utils/ocr';

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
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [ocrRawText, setOcrRawText] = useState<string[]>([]);
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);

  console.log('ConfirmSubmissionScreen: Photo URI:', photoUri);
  console.log('ConfirmSubmissionScreen: Location:', latitude, longitude);
  console.log('ConfirmSubmissionScreen: On-device OCR available:', isOCRAvailable());

  const processOnDeviceOCR = useCallback(async () => {
    console.log('[OCR] Starting on-device OCR process for photo:', photoUri);
    setLoading(true);
    setOcrStatus('Processing image on-device...');
    
    try {
      // Step 1: Upload photo to backend storage (for submission record)
      console.log('[Upload] Uploading photo to /api/upload-photo...');
      setOcrStatus('Uploading photo...');
      
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
      console.log('[Upload] Photo uploaded successfully:', uploadResult.photoUrl);
      setUploadedPhotoUrl(uploadResult.photoUrl);

      // Step 2: Perform on-device OCR (zero cloud API calls)
      console.log('[OCR] Starting on-device text recognition...');
      console.log('[OCR] Platform:', Platform.OS);
      console.log('[OCR] Using:', Platform.OS === 'ios' ? 'Apple Vision Framework' : 'Google ML Kit');
      setOcrStatus('Detecting numbers on-device...');
      
      const ocrResult = await performOCR(photoUri);
      
      console.log('[OCR] ===== ON-DEVICE OCR RESULT =====');
      console.log('[OCR] Detected number:', ocrResult.detectedNumber);
      console.log('[OCR] All text found:', ocrResult.allText);
      console.log('[OCR] Confidence score:', ocrResult.confidence);
      console.log('[OCR] Raw text blocks:', JSON.stringify(ocrResult.allText, null, 2));
      console.log('[OCR] ===================================');

      // Store raw OCR data for debugging
      setOcrRawText(ocrResult.allText);
      setOcrConfidence(ocrResult.confidence);

      if (ocrResult.detectedNumber !== null && ocrResult.detectedNumber !== undefined) {
        const detectedStr = String(ocrResult.detectedNumber).padStart(6, '0');
        setDetectedNumber(detectedStr);
        setConfirmedNumber(detectedStr);
        console.log('[OCR] ✅ Number detected successfully:', detectedStr);
        setOcrStatus(`Number detected: ${detectedStr}`);
      } else {
        console.log('[OCR] ⚠️ No number detected from OCR');
        console.log('[OCR] User will need to enter manually');
        console.log('[OCR] Tip: Try closer zoom, better lighting, or clearer angle');
        setDetectedNumber('');
        setConfirmedNumber('');
        setOcrStatus('No number detected - try closer zoom, better light, or enter manually');
      }
    } catch (error) {
      console.error('[OCR] ❌ Error in on-device OCR process:', error);
      console.error('[OCR] Error details:', JSON.stringify(error, null, 2));
      setDetectedNumber('');
      setConfirmedNumber('');
      setOcrStatus('OCR failed - please enter manually');
    } finally {
      setLoading(false);
    }
  }, [photoUri]);

  useEffect(() => {
    processOnDeviceOCR();
  }, [processOnDeviceOCR]);

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
      console.log('[API] Submitting entry to /api/submit-entry...');
      console.log('[API] Confirmed number:', confirmedNumber);
      console.log('[API] Photo URL:', uploadedPhotoUrl);
      console.log('[API] Location:', latitude, longitude);
      console.log('[API] OCR raw text:', ocrRawText);
      console.log('[API] OCR confidence:', ocrConfidence);
      
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
              submissionId: result.submission?.id || '',
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
  const platformName = Platform.OS === 'ios' ? 'Apple Vision' : Platform.OS === 'android' ? 'Google ML Kit' : 'Web';

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
            <Text style={styles.loadingText}>{ocrStatus}</Text>
            <View style={styles.ocrBadge}>
              <IconSymbol 
                ios_icon_name="cpu" 
                android_material_icon_name="memory" 
                size={16} 
                color={colors.success} 
              />
              <Text style={styles.ocrBadgeText}>On-Device Processing • {platformName}</Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.ocrInfoCard}>
              <IconSymbol 
                ios_icon_name="checkmark.shield.fill" 
                android_material_icon_name="verified-user" 
                size={24} 
                color={colors.success} 
              />
              <View style={styles.ocrInfoTextContainer}>
                <Text style={styles.ocrInfoTitle}>100% On-Device OCR</Text>
                <Text style={styles.ocrInfoSubtitle}>
                  {platformName} • Zero Cloud Costs • Privacy First
                </Text>
              </View>
            </View>

            {ocrRawText.length > 0 && (
              <View style={styles.debugCard}>
                <Text style={styles.debugTitle}>🔍 OCR Debug Info</Text>
                <Text style={styles.debugText}>Raw text blocks: {ocrRawText.length}</Text>
                <Text style={styles.debugText}>Confidence: {(ocrConfidence * 100).toFixed(0)}%</Text>
                <Text style={styles.debugText}>Text found: {ocrRawText.join(', ')}</Text>
              </View>
            )}

            <View style={styles.detectionCard}>
              <Text style={styles.detectionLabel}>Detected Number:</Text>
              <View style={styles.detectedNumberContainer}>
                <Text style={styles.detectedNumber}>{detectedNumber || 'None'}</Text>
              </View>
              {!detectedNumber && (
                <View style={styles.detectionHintContainer}>
                  <IconSymbol 
                    ios_icon_name="lightbulb.fill" 
                    android_material_icon_name="lightbulb" 
                    size={20} 
                    color={colors.warning} 
                  />
                  <Text style={styles.detectionHint}>
                    No number detected - try closer zoom, better light, or enter manually
                  </Text>
                </View>
              )}
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
    marginBottom: 10,
  },
  ocrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 127, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    gap: 8,
    marginTop: 10,
  },
  ocrBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  ocrInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 127, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    gap: 12,
  },
  ocrInfoTextContainer: {
    flex: 1,
  },
  ocrInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 4,
  },
  ocrInfoSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  debugCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.warning,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  detectionHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  detectionHint: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
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
