
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function AdminPreviewPostWinScreen() {
  const router = useRouter();

  console.log('[Admin Preview] Post-win details preview opened');

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <LinearGradient
        colors={['#00FF7F', '#00CC66']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <IconSymbol 
              ios_icon_name="trophy.fill" 
              android_material_icon_name="emoji-events" 
              size={60} 
              color="#FFD700" 
            />
            <Text style={styles.title}>Winner Details</Text>
            <Text style={styles.subtitle}>Your submission information</Text>
            <Text style={styles.previewBadge}>PREVIEW MODE</Text>
          </View>

          <View style={styles.submissionDetailsCard}>
            <Text style={styles.detailsTitle}>Your Submission Details</Text>
            
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400' }} 
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
              <Text style={styles.detailText}>Los Angeles, CA (34.0522, -118.2437)</Text>
            </View>
            
            <View style={styles.detailRow}>
              <IconSymbol 
                ios_icon_name="hand.raised.fill" 
                android_material_icon_name="edit" 
                size={20} 
                color={colors.secondary} 
              />
              <Text style={styles.detailText}>Manual entry provided by user</Text>
            </View>
          </View>

          <View style={styles.numberCard}>
            <Text style={styles.cardLabel}>Winning Number:</Text>
            <View style={styles.numberContainer}>
              <Text style={styles.number}>123456</Text>
            </View>
          </View>

          <View style={styles.prizeCard}>
            <Text style={styles.prizeAmount}>$25</Text>
            <Text style={styles.prizeLabel}>Prize Won!</Text>
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
            <Text style={styles.backButtonText}>Back to Admin Dashboard</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  previewBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF4500',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 15,
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
  submissionPhoto: {
    width: '100%',
    height: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  numberCard: {
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
    backgroundColor: colors.success,
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  number: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
