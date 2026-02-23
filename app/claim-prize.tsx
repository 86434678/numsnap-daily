
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { authenticatedPost } from '@/utils/api';
import { useTheme } from '@react-navigation/native';

type PaymentMethod = 'paypal' | 'venmo' | 'egift';

export default function ClaimPrizeScreen() {
  const router = useRouter();
  const { colors: themeColors } = useTheme();
  const params = useLocalSearchParams();
  
  const submissionId = params.submissionId as string;
  const winningNumber = params.winningNumber as string;
  const prizeAmount = params.prizeAmount as string || '25';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    switch (method) {
      case 'paypal':
        return 'PayPal';
      case 'venmo':
        return 'Venmo';
      case 'egift':
        return 'Digital e-Gift Card';
      default:
        return '';
    }
  };

  const getPaymentMethodPlaceholder = (method: PaymentMethod): string => {
    switch (method) {
      case 'paypal':
        return 'Enter PayPal email or username';
      case 'venmo':
        return 'Enter Venmo username/handle (e.g., @username)';
      case 'egift':
        return 'Enter email for e-gift card delivery';
      default:
        return '';
    }
  };

  const getPaymentMethodDescription = (method: PaymentMethod): string => {
    switch (method) {
      case 'paypal':
        return 'We\'ll send $25 to your PayPal account. You can provide your PayPal email, username, or PayPal.Me link.';
      case 'venmo':
        return 'We\'ll send $25 to your Venmo account. Please provide your Venmo username or handle.';
      case 'egift':
        return 'We\'ll email you a $25 Visa or Amazon e-gift card code. No bank details required.';
      default:
        return '';
    }
  };

  const handleSubmitClaim = async () => {
    console.log('Submitting prize claim:', { submissionId, paymentMethod, paymentInfo, confirmedAccuracy });

    if (!paymentInfo.trim()) {
      setErrorMessage('Please enter your payment information.');
      setShowErrorModal(true);
      return;
    }

    if (!confirmedAccuracy) {
      setErrorMessage('Please confirm that your information is accurate.');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      console.log('Calling POST /api/prize-claims');
      const response = await authenticatedPost('/api/prize-claims', {
        submissionId,
        paymentMethod,
        paymentInfo: paymentInfo.trim(),
        confirmedAccuracy,
      });
      console.log('Prize claim response:', response);

      if (response.success) {
        console.log('Prize claim submitted successfully');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Prize claim error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit claim. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    console.log('Success modal closed - navigating to profile');
    setShowSuccessModal(false);
    router.replace('/(tabs)/profile');
  };

  const paymentMethodLabel = getPaymentMethodLabel(paymentMethod);
  const paymentMethodPlaceholder = getPaymentMethodPlaceholder(paymentMethod);
  const paymentMethodDescription = getPaymentMethodDescription(paymentMethod);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF8C00']}
          style={styles.prizeHeader}
        >
          <IconSymbol 
            ios_icon_name="trophy.fill" 
            android_material_icon_name="emoji-events" 
            size={60} 
            color="#FFFFFF" 
          />
          <Text style={styles.prizeTitle}>Congratulations!</Text>
          <Text style={styles.prizeSubtitle}>You won ${prizeAmount} USD</Text>
          <Text style={styles.winningNumberText}>Winning Number: {winningNumber}</Text>
        </LinearGradient>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Choose Payout Method</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Select how you&apos;d like to receive your prize. No bank details required.
          </Text>

          <View style={styles.paymentMethodsContainer}>
            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                paymentMethod === 'paypal' && styles.paymentMethodButtonActive,
              ]}
              onPress={() => setPaymentMethod('paypal')}
            >
              <View style={styles.radioOuter}>
                {paymentMethod === 'paypal' && <View style={styles.radioInner} />}
              </View>
              <Text style={[
                styles.paymentMethodText,
                paymentMethod === 'paypal' && styles.paymentMethodTextActive,
              ]}>
                PayPal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                paymentMethod === 'venmo' && styles.paymentMethodButtonActive,
              ]}
              onPress={() => setPaymentMethod('venmo')}
            >
              <View style={styles.radioOuter}>
                {paymentMethod === 'venmo' && <View style={styles.radioInner} />}
              </View>
              <Text style={[
                styles.paymentMethodText,
                paymentMethod === 'venmo' && styles.paymentMethodTextActive,
              ]}>
                Venmo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                paymentMethod === 'egift' && styles.paymentMethodButtonActive,
              ]}
              onPress={() => setPaymentMethod('egift')}
            >
              <View style={styles.radioOuter}>
                {paymentMethod === 'egift' && <View style={styles.radioInner} />}
              </View>
              <Text style={[
                styles.paymentMethodText,
                paymentMethod === 'egift' && styles.paymentMethodTextActive,
              ]}>
                Digital e-Gift Card
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.descriptionBox}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {paymentMethodDescription}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Payment Information</Text>
          <TextInput
            style={[styles.input, { color: themeColors.text, borderColor: colors.border }]}
            placeholder={paymentMethodPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={paymentInfo}
            onChangeText={setPaymentInfo}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={paymentMethod === 'egift' || paymentMethod === 'paypal' ? 'email-address' : 'default'}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setConfirmedAccuracy(!confirmedAccuracy)}
          >
            <View style={[styles.checkbox, confirmedAccuracy && styles.checkboxChecked]}>
              {confirmedAccuracy && (
                <IconSymbol 
                  ios_icon_name="checkmark" 
                  android_material_icon_name="check" 
                  size={18} 
                  color="#FFFFFF" 
                />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: themeColors.text }]}>
              I confirm that the information provided is accurate and understand that prizes are processed manually within 7 business days.
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!confirmedAccuracy || !paymentInfo.trim() || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmitClaim}
          disabled={!confirmedAccuracy || !paymentInfo.trim() || loading}
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
              <Text style={styles.submitButtonText}>Submit Claim</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
          You have 30 days from your win date to claim your prize. After that, the prize will be forfeited.
        </Text>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name="check-circle" 
              size={80} 
              color="#4CAF50" 
            />
            <Text style={styles.modalTitle}>Claim Submitted!</Text>
            <Text style={styles.modalMessage}>
              Your prize claim has been submitted successfully. Check your email for updates on payment processing (within 7 business days).
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccessClose}
            >
              <Text style={styles.modalButtonText}>View My Profile</Text>
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
              size={80} 
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  prizeHeader: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  prizeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
  },
  prizeSubtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 5,
  },
  winningNumberText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 10,
    opacity: 0.9,
  },
  section: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  paymentMethodsContainer: {
    gap: 12,
    marginBottom: 15,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  paymentMethodButtonActive: {
    borderColor: colors.primary,
    backgroundColor: '#E3F2FD',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  paymentMethodTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  descriptionBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
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
    maxWidth: 400,
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
    backgroundColor: colors.primary,
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
