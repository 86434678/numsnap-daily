
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function AdminPreviewPostWinScreen() {
  const router = useRouter();

  const dummyPhotoUrl = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400';
  const dummyLocation = 'Los Angeles, CA';
  const dummyCoordinates = '(34.0522, -118.2437)';
  const isManualEntry = true;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>PREVIEW MODE</Text>
          </View>

          <View style={styles.header}>
            <IconSymbol 
              ios_icon_name="photo.fill" 
              android_material_icon_name="photo-camera" 
              size={60} 
              color="#FFFFFF" 
            />
            <Text style={styles.title}>Post-Win Submission Details</Text>
            <Text style={styles.subtitle}>Mock claim screen with photo, location, and notes</Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Your Submission Details</Text>
            
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: dummyPhotoUrl }} 
                style={styles.submissionPhoto}
                resizeMode="cover"
              />
            </View>
            
            <View style={styles.detailRow}>
              <IconSymbol 
                ios_icon_name="location.fill" 
                android_material_icon_name="location-on" 
                size={20} 
                color={colors.primary} 
              />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailText}>{dummyLocation}</Text>
                <Text style={styles.detailSubtext}>{dummyCoordinates}</Text>
              </View>
            </View>
            
            {isManualEntry && (
              <View style={styles.detailRow}>
                <IconSymbol 
                  ios_icon_name="hand.raised.fill" 
                  android_material_icon_name="pan-tool" 
                  size={20} 
                  color={colors.secondary} 
                />
                <Text style={styles.detailText}>Manual entry provided by user</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <IconSymbol 
                ios_icon_name="clock.fill" 
                android_material_icon_name="schedule" 
                size={20} 
                color={colors.textSecondary} 
              />
              <Text style={styles.detailText}>Submitted at 2:45 PM PST</Text>
            </View>
          </View>

          <View style={styles.prizeCard}>
            <Text style={styles.prizeAmount}>$25</Text>
            <Text style={styles.prizeLabel}>Prize Won!</Text>
            <Text style={styles.prizeSubtext}>Claim your prize to receive payment</Text>
          </View>

          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => console.log('[Admin Preview] Claim button tapped (dummy)')}
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

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol 
              ios_icon_name="arrow.left" 
              android_material_icon_name="arrow-back" 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.backButtonText}>Back to Admin Preview</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  previewBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    padding: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  detailsCard: {
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
  submissionPhoto: {
    width: '100%',
    height: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  detailSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    gap: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
