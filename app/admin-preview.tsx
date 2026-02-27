
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function AdminPreviewScreen() {
  const router = useRouter();

  console.log('[Admin Preview] Admin preview dashboard opened');

  const handlePreviewWinScreen = () => {
    console.log('[Admin Preview] Opening win screen preview');
    router.push('/admin-preview-win');
  };

  const handlePreviewPaywall = () => {
    console.log('[Admin Preview] Opening paywall preview');
    router.push('/admin-preview-paywall');
  };

  const handlePreviewPostWinDetails = () => {
    console.log('[Admin Preview] Opening post-win details preview');
    router.push('/admin-preview-post-win');
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <IconSymbol 
              ios_icon_name="wrench.and.screwdriver.fill" 
              android_material_icon_name="build" 
              size={60} 
              color="#FFFFFF" 
            />
            <Text style={styles.title}>Admin Preview Tools</Text>
            <Text style={styles.subtitle}>Test UI components with dummy data</Text>
          </View>

          <TouchableOpacity style={styles.previewCard} onPress={handlePreviewWinScreen}>
            <View style={styles.cardIcon}>
              <IconSymbol 
                ios_icon_name="trophy.fill" 
                android_material_icon_name="emoji-events" 
                size={40} 
                color="#FFD700" 
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Preview Win Screen</Text>
              <Text style={styles.cardDescription}>
                See the full win screen with confetti, $25 prize, and claim button
              </Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.previewCard} onPress={handlePreviewPaywall}>
            <View style={styles.cardIcon}>
              <IconSymbol 
                ios_icon_name="creditcard.fill" 
                android_material_icon_name="credit-card" 
                size={40} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Preview Paywall</Text>
              <Text style={styles.cardDescription}>
                View paywall UI with dummy pricing ($4.99/mo, $29.99/yr)
              </Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.previewCard} onPress={handlePreviewPostWinDetails}>
            <View style={styles.cardIcon}>
              <IconSymbol 
                ios_icon_name="photo.fill" 
                android_material_icon_name="photo-camera" 
                size={40} 
                color={colors.success} 
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Simulate Post-Win Details</Text>
              <Text style={styles.cardDescription}>
                Mock claim screen with photo, location, and manual entry note
              </Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol 
              ios_icon_name="arrow.left" 
              android_material_icon_name="arrow-back" 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.backButtonText}>Back to Home</Text>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardIcon: {
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    gap: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
