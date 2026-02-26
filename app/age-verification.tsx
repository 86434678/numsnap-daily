
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';

export default function AgeVerificationScreen() {
  const router = useRouter();
  const { colors: themeColors } = useTheme();
  const { verifyAge, refreshAgeStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showUnderageModal, setShowUnderageModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerifyAge = async (isOver18: boolean) => {
    console.log('[AgeVerification] User age verification:', isOver18 ? '18+' : 'Under 18');

    if (!isOver18) {
      console.log('[AgeVerification] User is under 18 - showing underage modal');
      setShowUnderageModal(true);
      return;
    }

    setLoading(true);
    try {
      // Use the AuthContext verifyAge which calls POST /api/verify-age with age=18
      // and updates the ageVerified state in context
      console.log('[AgeVerification] Calling verifyAge(18) via AuthContext...');
      await verifyAge(18);
      console.log('[AgeVerification] Age verified successfully - refreshing status and navigating to home');
      await refreshAgeStatus();
      // Navigate to home after successful age verification
      router.replace('/(tabs)/(home)/');
    } catch (error) {
      console.error('[AgeVerification] Age verification error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to verify age. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUnderageClose = () => {
    console.log('Underage modal closed - navigating to rules');
    setShowUnderageModal(false);
    router.replace('/rules');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <LinearGradient
        colors={['#4A90E2', '#7B68EE', '#9B59B6']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <IconSymbol 
              ios_icon_name="checkmark.shield.fill" 
              android_material_icon_name="verified-user" 
              size={80} 
              color="#FFFFFF" 
            />
          </View>

          <Text style={styles.title}>Age Verification Required</Text>
          <Text style={styles.subtitle}>
            You must be 18 years or older to participate in NumSnap Daily sweepstakes.
          </Text>

          <View style={styles.questionContainer}>
            <Text style={styles.question}>Are you 18 years of age or older?</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.yesButton]}
              onPress={() => handleVerifyAge(true)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol 
                    ios_icon_name="checkmark.circle.fill" 
                    android_material_icon_name="check-circle" 
                    size={24} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.buttonText}>Yes, I&apos;m 18+</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.noButton]}
              onPress={() => handleVerifyAge(false)}
              disabled={loading}
            >
              <IconSymbol 
                ios_icon_name="xmark.circle.fill" 
                android_material_icon_name="cancel" 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.buttonText}>No, I&apos;m under 18</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Age is self-declared and verified via this in-app age gate. False declaration may result in disqualification.
          </Text>
        </View>
      </LinearGradient>

      {/* Underage Modal */}
      <Modal
        visible={showUnderageModal}
        transparent
        animationType="fade"
        onRequestClose={handleUnderageClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="warning" 
              size={60} 
              color="#FF6B6B" 
            />
            <Text style={styles.modalTitle}>Sorry!</Text>
            <Text style={styles.modalMessage}>
              You must be 18 years or older to participate in NumSnap Daily. Come back when you&apos;re eligible!
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleUnderageClose}
            >
              <Text style={styles.modalButtonText}>View Official Rules</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol 
              ios_icon_name="exclamationmark.circle.fill" 
              android_material_icon_name="error" 
              size={60} 
              color="#FF6B6B" 
            />
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  questionContainer: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  yesButton: {
    backgroundColor: '#4CAF50',
  },
  noButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
