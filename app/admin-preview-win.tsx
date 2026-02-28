
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdminPreviewWinScreen() {
  const router = useRouter();

  const handleClaimPrize = () => {
    console.log('Admin navigating to post-win preview');
    router.push('/admin-preview-postwin');
  };

  const handleClose = () => {
    console.log('Admin closing win preview');
    router.back();
  };

  const userNumberDisplay = '123456';
  const targetNumberDisplay = '123456';
  const timeDisplay = '2:45 PM';
  const dateDisplay = 'Jan 15, 2024';
  const locationText = 'San Francisco, CA';

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Win Preview',
          headerShown: true,
          headerBackTitle: 'Back',
        }} 
      />
      <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
        <LinearGradient
          colors={['#00FF7F', '#00CC66']}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <View style={styles.adminBadge}>
              <IconSymbol 
                ios_icon_name="eye.fill" 
                android_material_icon_name="visibility" 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.adminBadgeText}>ADMIN PREVIEW</Text>
            </View>

            <View style={styles.header}>
              <IconSymbol 
                ios_icon_name="trophy.fill" 
                android_material_icon_name="emoji-events" 
                size={80} 
                color="#FFD700" 
              />
              <Text style={styles.winTitle}>WINNER!</Text>
              <Text style={styles.winSubtitle}>Congratulations! You matched the number!</Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.cardLabel}>Your Snap:</Text>
              <View style={styles.numberContainer}>
                <Text style={styles.number}>{userNumberDisplay}</Text>
              </View>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.cardLabel}>Today&apos;s Number:</Text>
              <View style={[styles.numberContainer, styles.matchContainer]}>
                <Text style={styles.number}>{targetNumberDisplay}</Text>
              </View>
              <Text style={styles.matchText}>Perfect Match! 🎉</Text>
            </View>

            <View style={styles.submissionDetailsCard}>
              <Text style={styles.detailsTitle}>Your Submission Details</Text>
              
              <View style={styles.photoContainer}>
                <View style={styles.placeholderPhoto}>
                  <IconSymbol 
                    ios_icon_name="photo.fill" 
                    android_material_icon_name="image" 
                    size={60} 
                    color={colors.textSecondary} 
                  />
                  <Text style={styles.placeholderText}>Sample Photo</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <IconSymbol 
                  ios_icon_name="location.fill" 
                  android_material_icon_name="location-on" 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.detailText}>{locationText}</Text>
              </View>
            </View>

            <View style={styles.prizeCard}>
              <Text style={styles.prizeAmount}>$25</Text>
              <Text style={styles.prizeLabel}>Prize Won!</Text>
              <Text style={styles.prizeSubtext}>Tap below to claim your prize</Text>
            </View>

            <TouchableOpacity 
              style={styles.claimButton}
              onPress={handleClaimPrize}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.claimButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <IconSymbol 
                  ios_icon_name="gift.fill" 
                  android_material_icon_name="card-giftcard" 
                  size={24} 
                  color="#FFFFFF" 
                />
                <Text style={styles.claimButtonText}>Claim Your Prize</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.watermarkCard}>
              <IconSymbol 
                ios_icon_name="person.fill" 
                android_material_icon_name="person" 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={styles.watermarkText}>
                Sample result – Admin Preview – {timeDisplay} on {dateDisplay}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Text style={styles.backButtonText} onPress={handleClose}>
                Back to Preview Menu
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  winTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  winSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 15,
    fontWeight: '600',
  },
  numberContainer: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  matchContainer: {
    backgroundColor: colors.success,
  },
  number: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  matchText: {
    fontSize: 18,
    color: colors.success,
    marginTop: 15,
    fontWeight: 'bold',
  },
  submissionDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  photoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#F0F0F0',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  prizeCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  prizeAmount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  prizeLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 5,
  },
  prizeSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
    textAlign: 'center',
  },
  watermarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  watermarkText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  claimButton: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  claimButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
